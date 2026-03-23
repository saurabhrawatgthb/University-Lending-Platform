import React, { useEffect, useState } from 'react';
import { RequestService } from './api/apiClient';
import { WebSocketService } from './api/websocketClient';
import { Plus, Bell, Clock, MapPin, AlertCircle, Search } from 'lucide-react';

export const Dashboard = ({ user }: { user: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newReq, setNewReq] = useState({ title: '', category: 'ELECTRONICS', urgency: 'HIGH', durationHours: 2, description: '' });

  useEffect(() => {
    // Load initial feed
    RequestService.getFeed().then(res => setRequests(res.data.content || []));

    // Connect WebSocket
    const ws = new WebSocketService(
      (payload) => {
        // Direct personal notification
        setNotifications(prev => [payload, ...prev]);
        if (payload.type === 'NEW_OFFER') {
          alert('You received a new offer!');
        }
      },
      (payload) => {
        // Local broadcast (Someone nearby requested an item)
        setNotifications(prev => [payload, ...prev]);
        // Refresh feed to see the new request
        RequestService.getFeed().then(res => setRequests(res.data.content || []));
      },
      user.id,
      user.hostelBlock
    );
    ws.connect();
    return () => ws.disconnect();
  }, [user.id]);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await RequestService.createRequest({ ...newReq, locationTag: user.hostelBlock }, user.id);
    setShowModal(false);
    RequestService.getFeed().then(res => setRequests(res.data.content || []));
    setNewReq({ title: '', category: 'ELECTRONICS', urgency: 'HIGH', durationHours: 2, description: '' });
  };

  const handleOffer = async (requestId: string) => {
    await RequestService.makeOffer(requestId, { message: 'I have this, come grab it!' }, user.id);
    alert('Offer sent!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">C</span>
            CampusLend
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer group">
              <Bell className="w-6 h-6 text-gray-500 group-hover:text-primary-600 transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center">{notifications.length}</span>
              )}
            </div>
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium text-gray-900">{user.fullName}</p>
              <p className="text-xs text-gray-500">{user.hostelBlock} • ⭐ {user.trustScore}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Col - Feed */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Active Requests Nearby</h2>
             <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search items..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary-500" />
             </div>
          </div>

          <div className="grid gap-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{req.title}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${req.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {req.urgency} URGENCY
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{req.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {req.locationTag}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Needed for {req.durationHours}h</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {req.category}</span>
                </div>
                {req.requester.id !== user.id ? (
                    <button onClick={() => handleOffer(req.id)} className="w-full btn-secondary text-primary-600 border-primary-200 hover:bg-primary-50">
                        I have this item
                    </button>
                ) : (
                    <div className="w-full text-center text-sm text-gray-400 bg-gray-50 py-2 rounded-lg">Your Request</div>
                )}
              </div>
            ))}
            {requests.length === 0 && <p className="text-center text-gray-500 py-10">No active requests nearby. It's quiet!</p>}
          </div>
        </div>

        {/* Right Col - Pinned Notifications & Stats */}
        <div className="w-full md:w-80 space-y-6 hidden md:block">
           <div className="bg-gradient-to-br from-primary-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-1">Karma Points</h3>
              <p className="text-4xl font-bold mb-4">420</p>
              <button disabled className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all rounded-lg py-2 text-sm font-medium">Redeem Rewards</button>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                 {notifications.length === 0 ? <p className="text-sm text-gray-500">No recent notifications.</p> : null}
                 {notifications.slice(0, 5).map((n, i) => (
                    <div key={i} className="flex gap-3 items-start">
                        <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
                        <p className="text-sm text-gray-700">{n.message}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {/* FAB - Create Request */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">I Need An Item</h2>
                <form onSubmit={handlePostRequest} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
                        <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="E.g., Mac Charger USB-C" value={newReq.title} onChange={e=>setNewReq({...newReq, title:e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="My laptop is at 2%, urgent help needed..." value={newReq.description} onChange={e=>setNewReq({...newReq, description:e.target.value})} />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={newReq.urgency} onChange={e=>setNewReq({...newReq, urgency:e.target.value})}>
                                <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">For (Hours)</label>
                            <input type="number" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={newReq.durationHours} onChange={e=>setNewReq({...newReq, durationHours:parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 bg-white text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium shadow-md hover:bg-primary-700">Post Request</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

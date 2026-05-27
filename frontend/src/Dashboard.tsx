import React, { useEffect, useState } from 'react';
import { RequestService, TransactionService, UserService, NotificationService } from './api/apiClient';
import { WebSocketService } from './api/websocketClient';
import { 
  Plus, Bell, Clock, MapPin, Search, 
  HelpCircle, Check, RefreshCw, Send, 
  ArrowUpRight, ShieldAlert, CheckCircle2,
  Star, MessageSquare, ChevronDown, ChevronUp,
  Award, TrendingUp, Sparkles, X
} from 'lucide-react';

export const Dashboard = ({ user, onLogout }: { user: any, onLogout?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'my-requests' | 'transactions' | 'alerts'>('feed');
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [selectedRequestOffers, setSelectedRequestOffers] = useState<{ [reqId: string]: any[] }>({});
  
  // Custom Toast state
  const [toasts, setToasts] = useState<any[]>([]);
  
  // Coordination chat state
  const [txChats, setTxChats] = useState<{ [txId: string]: any[] }>({});
  const [openChatTxId, setOpenChatTxId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Rating Feedback Loop state
  const [ratedTxIds, setRatedTxIds] = useState<{ [txId: string]: boolean }>({});
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Modal & Forms State
  const [showModal, setShowModal] = useState(false);
  const [newReq, setNewReq] = useState({ 
    title: '', 
    category: 'ELECTRONICS', 
    urgency: 'HIGH', 
    durationHours: 2, 
    description: '' 
  });
  
  // Offer Submission State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offeredRequestId, setOfferedRequestId] = useState<string | null>(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Dev Mode Helper (user ID starts with 'dev-' when backend is unavailable)
  const isDevMode = !!user?.id?.toString().startsWith('dev-');

  // Toast Helper
  const addToast = (type: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Fetch all dashboard data
  const loadData = () => {
    if (!user?.id) return;

    // In dev mode, do nothing — data is managed purely in local state
    if (isDevMode) return;

    // 1. Load active requests feed and auto-fetch offers for own requests
    RequestService.getFeed().then(res => {
      const feed = res.data?.content || res.data || [];
      setRequests(feed);
      
      // Auto-fetch offers for the user's own requests
      const myReqs = feed.filter((req: any) => req.requester?.id === user.id);
      myReqs.forEach((req: any) => {
        loadOffersForRequest(req.id);
      });
    }).catch(err => console.error('Failed to load feed:', err));

    // 2. Load active transactions (borrows/lends)
    TransactionService.getMyTransactions(user.id).then(res => {
      setMyTransactions(res.data || []);
    }).catch(err => console.error('Failed to load transactions:', err));

    // 3. Load historical notifications from DB
    NotificationService.getNotifications(user.id).then(res => {
      setNotifications(res.data || []);
    }).catch(err => console.error('Failed to load historical notifications:', err));
  };

  // Fetch offers for a specific request
  const loadOffersForRequest = (requestId: string) => {
    // In dev mode, offers are managed in local state — no REST call
    if (isDevMode) return;
    RequestService.getOffers(requestId).then(res => {
      setSelectedRequestOffers(prev => ({
        ...prev,
        [requestId]: res.data || []
      }));
    }).catch(err => console.error('Failed to fetch offers:', err));
  };

  useEffect(() => {
    if (!user) return;

    // In dev mode, populate with mock data and skip WebSocket/REST
    if (isDevMode) {
      const mockRequests = [
        {
          id: `mock-req-1`,
          title: 'USB-C Laptop Charger',
          description: 'My laptop is about to die and I have a presentation in 30 minutes. Need it urgently!',
          category: 'ELECTRONICS',
          urgency: 'HIGH',
          durationHours: 2,
          locationTag: user.hostelBlock || 'Block A',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          requester: { id: `mock-other-1`, fullName: 'Priya Sharma', trustScore: 4.8 }
        },
        {
          id: `mock-req-2`,
          title: 'Scientific Calculator',
          description: 'Have a math exam at 3 PM. Forgot mine at home over the weekend.',
          category: 'STATIONERY',
          urgency: 'MEDIUM',
          durationHours: 3,
          locationTag: 'Block B',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          requester: { id: `mock-other-2`, fullName: 'Rahul Verma', trustScore: 4.5 }
        },
        {
          id: `mock-req-3`,
          title: 'Umbrella',
          description: 'It started raining suddenly. Going home for dinner across campus.',
          category: 'CLOTHING',
          urgency: 'LOW',
          durationHours: 1,
          locationTag: user.hostelBlock || 'Block A',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          requester: { id: `mock-other-3`, fullName: 'Anjali Singh', trustScore: 5.0 }
        }
      ];
      setRequests(mockRequests);
      return;
    }

    loadData();

    // Connect WebSocket
    const ws = new WebSocketService(
      (payload) => {
        // Direct personal notification
        setNotifications(prev => [payload, ...prev]);
        loadData(); // Hot reload data on new offer/acceptance/status updates
        
        // Skip self alert toast popups
        if (payload.message && user?.fullName && payload.message.startsWith(user.fullName)) {
          return;
        }
        addToast(payload.type || 'INFO', payload.message);
      },
      (payload) => {
        // Local broadcast (Someone nearby requested an item or request fulfilled)
        setNotifications(prev => [payload, ...prev]);
        loadData(); // Hot reload feed
        
        // Skip self alert toast popups
        if (payload.message && user?.fullName && payload.message.startsWith(user.fullName)) {
          return;
        }
        addToast(payload.type || 'BROADCAST', payload.message);
      },
      user.id,
      user.hostelBlock || 'Block A'
    );
    ws.connect();
    
    return () => ws.disconnect();
  }, [user?.id]);

  // Handle post request
  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Dev mode: create a mock request in local state immediately
    if (isDevMode) {
      const mockReq = {
        id: `dev-req-${Date.now()}`,
        title: newReq.title,
        description: newReq.description,
        category: newReq.category,
        urgency: newReq.urgency,
        durationHours: newReq.durationHours,
        locationTag: user.hostelBlock || 'Block A',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        requester: { id: user.id, fullName: user.fullName, trustScore: user.trustScore ?? 5.0 }
      };
      setRequests(prev => [mockReq, ...prev]);
      setSelectedRequestOffers(prev => ({ ...prev, [mockReq.id]: [] }));
      setShowModal(false);
      addToast('SUCCESS', 'Your query has been posted campus-wide! (Dev Mode)');
      setNewReq({ title: '', category: 'ELECTRONICS', urgency: 'HIGH', durationHours: 2, description: '' });
      return;
    }

    try {
      await RequestService.createRequest({ ...newReq, locationTag: user.hostelBlock || 'Block A' }, user.id);
      setShowModal(false);
      loadData();
      addToast('SUCCESS', 'Your query has been posted campus-wide! WebSockets are broadcasting...');
      setNewReq({ title: '', category: 'ELECTRONICS', urgency: 'HIGH', durationHours: 2, description: '' });
    } catch (err) {
      console.error('Failed to post request:', err);
      addToast('ERROR', 'Failed to publish request.');
    }
  };

  // Trigger offer modal
  const openOfferModal = (requestId: string) => {
    setOfferedRequestId(requestId);
    setOfferMessage('Hey, I have this item! You can collect it from ' + (user?.hostelBlock || 'Block A') + '.');
    setShowOfferModal(true);
  };

  // Submit lending offer
  const handlePostOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeredRequestId || !user?.id) return;
    setSubmittingOffer(true);

    // Dev mode: create a mock offer in local state immediately
    if (isDevMode) {
      const mockOffer = {
        id: `dev-offer-${Date.now()}`,
        message: offerMessage,
        status: 'PENDING',
        lender: { id: user.id, fullName: user.fullName, trustScore: user.trustScore ?? 5.0 }
      };
      setSelectedRequestOffers(prev => ({
        ...prev,
        [offeredRequestId]: [...(prev[offeredRequestId] || []), mockOffer]
      }));
      setShowOfferModal(false);
      setSubmittingOffer(false);
      addToast('SUCCESS', 'Offer submitted! The borrower has been notified. (Dev Mode)');
      return;
    }

    try {
      await RequestService.makeOffer(offeredRequestId, { message: offerMessage }, user.id);
      setShowOfferModal(false);
      loadData();
      addToast('SUCCESS', 'Offer submitted! The borrower has been notified in real-time.');
    } catch (err) {
      console.error('Failed to submit offer:', err);
      addToast('ERROR', 'Failed to submit offer.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Accept lending offer
  const handleAcceptOffer = async (requestId: string, offerId: string) => {
    if (!confirm('Are you sure you want to accept this offer? This will notify the lender.')) return;

    // Dev mode: create a mock transaction and update request status locally
    if (isDevMode) {
      const req = requests.find(r => r.id === requestId);
      const offer = selectedRequestOffers[requestId]?.find((o: any) => o.id === offerId);
      if (req && offer) {
        const mockTx = {
          id: `dev-tx-${Date.now()}`,
          status: 'PENDING_EXCHANGE',
          startTime: new Date().toISOString(),
          request: req,
          borrower: { id: user.id, fullName: user.fullName, hostelBlock: user.hostelBlock || 'Block A', trustScore: user.trustScore ?? 5.0 },
          lender: offer.lender
        };
        setMyTransactions(prev => [mockTx, ...prev]);
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'FULFILLED' } : r));
        setActiveTab('transactions');
        addToast('SUCCESS', 'Offer Accepted! Transaction generated. (Dev Mode)');
      }
      return;
    }

    try {
      await RequestService.acceptOffer(requestId, offerId);
      loadData();
      setActiveTab('transactions');
      addToast('SUCCESS', 'Offer Accepted! Transaction generated and synced.');
    } catch (err) {
      console.error('Failed to accept offer:', err);
      addToast('ERROR', 'Failed to accept offer.');
    }
  };

  // Update Handoff status
  const handleUpdateStatus = async (txId: string, status: string) => {
    // Dev mode: update transaction status in local state
    if (isDevMode) {
      setMyTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status } : tx));
      addToast('SUCCESS', `Status updated to ${status.replace('_', ' ')}! (Dev Mode)`);
      return;
    }

    try {
      await TransactionService.updateTransactionStatus(txId, status);
      loadData();
      addToast('SUCCESS', `Status updated to ${status.replace('_', ' ')}!`);
    } catch (err) {
      console.error('Failed to update transaction status:', err);
      addToast('ERROR', 'Failed to sync status update.');
    }
  };

  // Star Rating feedback loop submitter
  const handleSubmitRating = async (tx: any, counterpart: any) => {
    if (!counterpart?.id) return;
    const currentScore = counterpart.trustScore ?? 5.0;
    // Weighted average: weight the existing score by 4 and add new rating, divide by 5
    const newScore = parseFloat(((currentScore * 4 + ratingScore) / 5).toFixed(1));

    // Dev mode: update trust score in local transaction state
    if (isDevMode) {
      setMyTransactions(prev => prev.map(t => {
        if (t.id !== tx.id) return t;
        const isBorrower = t.borrower?.id === user?.id;
        return {
          ...t,
          lender: !isBorrower ? t.lender : { ...t.lender, trustScore: newScore },
          borrower: isBorrower ? t.borrower : { ...t.borrower, trustScore: newScore }
        };
      }));
      setRatedTxIds(prev => ({ ...prev, [tx.id]: true }));
      setRatingComment('');
      setRatingScore(5);
      addToast('SUCCESS', `⭐ Trust score for ${counterpart.fullName} updated to ${newScore}! (Dev Mode)`);
      return;
    }

    try {
      await UserService.updateTrustScore(counterpart.id, newScore);
      
      setRatedTxIds(prev => ({ ...prev, [tx.id]: true }));
      setRatingComment('');
      setRatingScore(5);
      
      addToast('SUCCESS', `⭐ Trust score for ${counterpart.fullName} updated to ${newScore}!`);
      loadData(); // Reload stats and scores
    } catch (err) {
      console.error('Failed to submit rating:', err);
      addToast('ERROR', 'Failed to update trust score.');
    }
  };

  // Toggle Coordinate Chats
  const handleToggleChat = (tx: any) => {
    const txId = tx.id;
    if (openChatTxId === txId) {
      setOpenChatTxId(null);
      return;
    }
    
    // Initialize with mock coord messages if empty
    if (!txChats[txId]) {
      const isBorrower = tx.borrower?.id === user?.id;
      const counterpartName = isBorrower ? tx.lender?.fullName : tx.borrower?.fullName;
      const myName = user?.fullName || 'Me';
      const itemTitle = tx.request?.title || 'item';
      
      let initialMsgs = [];
      if (tx.status === 'PENDING_EXCHANGE') {
        initialMsgs = [
          { sender: counterpartName, text: `Hey ${myName}! I have the ${itemTitle} ready for you. Shall we meet up outside the lobby?`, time: '10:05 AM' },
          { sender: myName, text: `Hi! That sounds great. I can come over in about 10 minutes. Does that work for you?`, time: '10:07 AM' },
          { sender: counterpartName, text: `Perfect! I'll wait near the entrance. See you soon!`, time: '10:08 AM' }
        ];
      } else if (tx.status === 'IN_POSSESSION') {
        initialMsgs = [
          { sender: myName, text: `Hey, just checking in. The ${itemTitle} works beautifully. Thanks again!`, time: 'Yesterday' },
          { sender: counterpartName, text: `Awesome! Glad it helped. Let me know whenever you're ready to return it.`, time: 'Yesterday' }
        ];
      } else {
        initialMsgs = [
          { sender: myName, text: `Hey! I've returned the ${itemTitle} back. Let me know if everything is in order.`, time: '2 hours ago' },
          { sender: counterpartName, text: `Received! Everything looks perfect. Thanks for the quick return!`, time: '1 hour ago' }
        ];
      }
      setTxChats(prev => ({ ...prev, [txId]: initialMsgs }));
    }
    setOpenChatTxId(txId);
  };

  // Send coordination message
  const handleSendChatMessage = (txId: string, counterpartName: string) => {
    if (!chatMessage.trim()) return;
    
    const myName = user?.fullName || 'Me';
    const newMsg = { sender: myName, text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    setTxChats(prev => ({
      ...prev,
      [txId]: [...(prev[txId] || []), newMsg]
    }));
    setChatMessage('');
    
    // Trigger mock response after 1.5 seconds to make the app feel alive!
    setTimeout(() => {
      let responseText = "Sure, sounds perfect! Let's do that.";
      if (chatMessage.toLowerCase().includes('where') || chatMessage.toLowerCase().includes('meet')) {
        responseText = `Let's meet near the entrance block. I'm wearing a blue shirt!`;
      } else if (chatMessage.toLowerCase().includes('thank') || chatMessage.toLowerCase().includes('thanks')) {
        responseText = `You're very welcome! Glad I could help.`;
      } else if (chatMessage.toLowerCase().includes('late') || chatMessage.toLowerCase().includes('delay')) {
        responseText = `No worries at all! Take your time.`;
      }
      
      const botMsg = { sender: counterpartName, text: responseText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      
      setTxChats(prev => ({
        ...prev,
        [txId]: [...(prev[txId] || []), botMsg]
      }));
      addToast('CHAT', `💬 Coordination ping from ${counterpartName}`);
    }, 1500);
  };

  // Dynamic Karma calculations
  const completedLends = myTransactions.filter(tx => tx.status === 'RETURNED' && tx.lender?.id === user?.id).length;
  const completedBorrows = myTransactions.filter(tx => tx.status === 'RETURNED' && tx.borrower?.id === user?.id).length;
  const karmaPoints = 100 + (completedLends * 50) + (completedBorrows * 15);
  
  const getKarmaLevel = (points: number) => {
    if (points < 150) return { title: 'Level 1: Novice Helper', min: 100, max: 150, progress: ((points - 100) / 50) * 100 };
    if (points < 250) return { title: 'Level 2: Reliable Helper', min: 150, max: 250, progress: ((points - 150) / 100) * 100 };
    if (points < 400) return { title: 'Level 3: Good Samaritan', min: 250, max: 400, progress: ((points - 250) / 150) * 100 };
    return { title: 'Level 4: Campus Legend', min: 400, max: 600, progress: Math.min(100, ((points - 400) / 200) * 100) };
  };
  const karmaLevel = getKarmaLevel(karmaPoints);

  // Filtering requests
  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase();
    return (
      req.title?.toLowerCase()?.includes(query) ||
      req.description?.toLowerCase()?.includes(query) ||
      req.locationTag?.toLowerCase()?.includes(query)
    );
  });

  const myRequests = requests.filter(req => req.requester?.id === user?.id);
  const otherRequests = filteredRequests.filter(req => req.status === 'OPEN');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 pb-20 font-sans text-slate-800 antialiased relative">
      
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              CL
            </span>
            CampusLend
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-semibold text-slate-900 leading-tight">{user?.fullName || 'Guest'}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 justify-end mt-0.5">
                <MapPin className="w-3 h-3 text-primary-500" /> {user?.hostelBlock || 'Block A'} • ⭐ {user?.trustScore ?? '5.0'}
              </p>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 py-1.5 px-3 rounded-lg transition-all"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-none gap-2">
          <button 
            onClick={() => setActiveTab('feed')} 
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'feed' ? 'border-primary-600 text-primary-600 font-bold scale-105' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <HelpCircle className="w-4 h-4" /> Active Campus Requests
          </button>
          <button 
            onClick={() => setActiveTab('my-requests')} 
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'my-requests' ? 'border-primary-600 text-primary-600 font-bold scale-105' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowUpRight className="w-4 h-4" /> My Requests & Offers
          </button>
          <button 
            onClick={() => setActiveTab('transactions')} 
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'transactions' ? 'border-primary-600 text-primary-600 font-bold scale-105' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <RefreshCw className="w-4 h-4" /> Active Borrows & Lends ({myTransactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('alerts')} 
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 relative whitespace-nowrap ${activeTab === 'alerts' ? 'border-primary-600 text-primary-600 font-bold scale-105' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <Bell className="w-4 h-4" /> Notification Alerts
            {notifications.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-accent animate-ping absolute top-2.5 right-2" />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Side */}
          <div className="flex-1">
            
            {/* TAB 1: CAMPUS FEED */}
            {activeTab === 'feed' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Campus Requests Feed</h2>
                    <p className="text-sm text-slate-500 mt-1">Help fellow students who forgot something at home or need items urgently.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search items, locations..." 
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  {otherRequests.map(req => (
                    <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h3 className="text-lg font-bold text-slate-900 leading-snug">{req.title}</h3>
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                            req.urgency === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            req.urgency === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {req.urgency} URGENCY
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">{req.description}</p>
                      </div>

                      <div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-5 border-t border-slate-100 pt-4">
                          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-primary-500"/> {req.locationTag}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-indigo-500"/> Borrow: {req.durationHours}h
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg font-medium text-slate-600">
                            {req.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {req.requester?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{req.requester?.fullName || 'User'}</p>
                              <p className="text-[10px] text-slate-500">Trust Score: ⭐ {req.requester?.trustScore ?? '5.0'}</p>
                            </div>
                          </div>
                        </div>

                        {req.requester?.id === user?.id ? (
                          <div className="w-full text-center text-xs text-primary-600 bg-primary-50 py-2.5 px-4 rounded-xl border border-primary-100 font-bold">
                            Your Active Request
                          </div>
                        ) : (
                          <button 
                            onClick={() => openOfferModal(req.id)} 
                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl hover:from-primary-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-primary-500/10"
                          >
                            Offer Help
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {otherRequests.length === 0 && (
                    <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 py-16 px-6 text-center shadow-sm">
                      <p className="text-slate-400 text-sm font-medium">No active queries found. Everything is calm!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MY REQUESTS & LIVE OFFERS */}
            {activeTab === 'my-requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">My Requests & Live Offers</h2>
                  <p className="text-sm text-slate-500 mt-1">Review requests you raised and accept lending offers from other students.</p>
                </div>

                <div className="space-y-6">
                  {myRequests.map(req => (
                    <div key={req.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{req.title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              req.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              req.status === 'FULFILLED' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {req.status === 'FULFILLED' ? 'FULFILLED' : req.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Posted on: {req.createdAt ? new Date(req.createdAt).toLocaleString() : ''}</p>
                        </div>
                        
                        {req.status === 'OPEN' && (
                          <button 
                            onClick={() => loadOffersForRequest(req.id)}
                            className="text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Check for New Offers
                          </button>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-slate-600 text-sm mb-4 bg-slate-50 p-4 rounded-2xl">{req.description}</p>
                        
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Offers Submitted ({selectedRequestOffers[req.id]?.length || 0})</h4>
                          
                          {selectedRequestOffers[req.id]?.map((offer: any) => (
                            <div key={offer.id} className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-indigo-50/60 transition-colors">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{offer.lender?.fullName?.charAt(0) || 'U'}</span>
                                  <span className="text-sm font-bold text-slate-900">{offer.lender?.fullName || 'User'}</span>
                                  <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">⭐ {offer.lender?.trustScore ?? '5.0'}</span>
                                </div>
                                <p className="text-slate-600 text-sm italic">"{offer.message}"</p>
                              </div>
                              
                              {req.status === 'OPEN' ? (
                                <button 
                                  onClick={() => handleAcceptOffer(req.id, offer.id)}
                                  className="w-full sm:w-auto bg-primary-600 text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"
                                >
                                  <Check className="w-4 h-4" /> Accept Offer
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400 italic">
                                  {offer.status === 'ACCEPTED' ? 'Accepted ✅' : 'Declined'}
                                </span>
                              )}
                            </div>
                          ))}
                          
                          {(!selectedRequestOffers[req.id] || selectedRequestOffers[req.id].length === 0) && (
                            <p className="text-xs text-slate-400 italic py-2">No offers received yet. Notifications are active campus-wide.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {myRequests.length === 0 && (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 px-6 text-center shadow-sm">
                      <p className="text-slate-400 text-sm font-medium">You haven't posted any requests yet. Tap the FAB (+) below to request an item!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ACTIVE TRANSACTIONS */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Active Borrows & Lends</h2>
                  <p className="text-sm text-slate-500 mt-1">Coordinate handoffs, track possession details, and mark items as returned once finished.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-1">
                  {myTransactions.map(tx => {
                    const isBorrower = tx.borrower?.id === user?.id;
                    const counterpart = isBorrower ? tx.lender : tx.borrower;
                    const relation = isBorrower ? 'Borrowing' : 'Lending';
                    
                    return (
                      <div key={tx.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-100">
                            <div>
                              <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                                isBorrower ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-violet-50 text-violet-600 border border-violet-100'
                              }`}>
                                {relation} FLOW
                              </span>
                              <h3 className="text-lg font-bold text-slate-900 mt-2">{tx.request?.title || 'Requested Item'}</h3>
                            </div>
                            
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              tx.status === 'PENDING_EXCHANGE' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                              tx.status === 'IN_POSSESSION' ? 'bg-emerald-100 text-emerald-700' :
                              tx.status === 'RETURNED' ? 'bg-slate-100 text-slate-600' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {tx.status?.replace('_', ' ') || ''}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{isBorrower ? 'LENDER DETAILS' : 'BORROWER DETAILS'}</p>
                              <p className="text-sm font-semibold text-slate-800">{counterpart?.fullName || 'User'}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{counterpart?.email || ''}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-primary-500" /> {counterpart?.hostelBlock || 'Campus'}
                              </p>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-2xl">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">HANDOFF TIMELINE</p>
                              <p className="text-xs text-slate-600 font-medium">Handoff Scheduled: {tx.startTime ? new Date(tx.startTime).toLocaleString() : ''}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {tx.status === 'PENDING_EXCHANGE' ? 'Coordinate meetup in ' + (counterpart?.hostelBlock || 'Campus') + '.' : 
                                 tx.status === 'IN_POSSESSION' ? 'Item is in borrower\'s possession. Handle with care!' : 
                                 'Handoff complete. Thank you for contributing to campus karma!'}
                              </p>
                            </div>
                          </div>

                          {/* Stepper Progress Bar */}
                          <div className="mt-6 mb-6">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Handoff Progress Stepper</p>
                            <div className="relative flex items-center justify-between">
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
                              <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary-500 z-0 transition-all duration-500"
                                style={{
                                  width: tx.status === 'PENDING_EXCHANGE' ? '0%' :
                                         tx.status === 'IN_POSSESSION' ? '50%' : '100%'
                                }}
                              />
                              
                              {[
                                { status: 'PENDING_EXCHANGE', label: '1. Agreement', sub: 'Meetup Pending' },
                                { status: 'IN_POSSESSION', label: '2. In Use', sub: 'With Borrower' },
                                { status: 'RETURNED', label: '3. Completed', sub: 'Item Returned' }
                              ].map((step, idx) => {
                                const isCompleted = 
                                  tx.status === 'RETURNED' || 
                                  (tx.status === 'IN_POSSESSION' && idx < 2) || 
                                  (tx.status === 'PENDING_EXCHANGE' && idx < 1);
                                  
                                const isActive = tx.status === step.status;
                                
                                return (
                                  <div key={idx} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border shadow ${
                                      isActive ? 'bg-primary-600 text-white border-primary-600 ring-4 ring-primary-500/20' :
                                      isCompleted ? 'bg-emerald-500 text-white border-emerald-500' :
                                      'bg-white text-slate-400 border-slate-200'
                                    }`}>
                                      {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className={`text-[10px] font-bold mt-2 ${isActive ? 'text-primary-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>{step.label}</span>
                                    <span className="text-[8px] text-slate-400 mt-0.5">{step.sub}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Coordinator Chat Panel Toggle */}
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <button
                              onClick={() => handleToggleChat(tx)}
                              className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 focus:outline-none py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                {openChatTxId === tx.id ? 'Hide Meetup Coordination' : 'Show Meetup Coordination (Live Chat)'}
                              </span>
                              {openChatTxId === tx.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* coordination chat area */}
                            {openChatTxId === tx.id && (
                              <div className="mt-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex flex-col gap-3 shadow-inner">
                                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                  {(txChats[tx.id] || []).map((msg, midx) => {
                                    const isMe = msg.sender === (user?.fullName || 'Me');
                                    return (
                                      <div key={midx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[8px] text-slate-400 font-bold mb-0.5">{msg.sender}</span>
                                        <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs ${
                                          isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                        }`}>
                                          {msg.text}
                                        </div>
                                        <span className="text-[7px] text-slate-400 mt-0.5">{msg.time}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2 border-t border-slate-200/50 pt-2.5">
                                  <input
                                    type="text"
                                    placeholder="Type coordination message..."
                                    className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                                    value={chatMessage}
                                    onChange={e => setChatMessage(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSendChatMessage(tx.id, counterpart.fullName);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSendChatMessage(tx.id, counterpart.fullName)}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-xl flex items-center justify-center"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status update buttons */}
                        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                          {tx.status === 'PENDING_EXCHANGE' && isBorrower && (
                            <button 
                              onClick={() => handleUpdateStatus(tx.id, 'IN_POSSESSION')}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Confirm Handoff (I Received the Item)
                            </button>
                          )}
                          
                          {tx.status === 'IN_POSSESSION' && isBorrower && (
                            <button 
                              onClick={() => handleUpdateStatus(tx.id, 'RETURNED')}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10"
                            >
                              <CheckCircle2 className="w-4 h-4" /> I Returned the Item
                            </button>
                          )}
                          
                          {(!isBorrower && tx.status !== 'RETURNED') && (
                            <div className="w-full text-center text-xs text-slate-400 bg-slate-50/50 py-3 px-4 rounded-xl border border-slate-200/50 flex items-center justify-center gap-1.5 italic font-medium">
                              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" /> Waiting for borrower to update handoff state...
                            </div>
                          )}
                          
                          {tx.status === 'RETURNED' && (
                            <div className="w-full">
                              <div className="text-center text-xs text-emerald-600 bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5 font-semibold">
                                <CheckCircle2 className="w-4 h-4" /> Handoff Complete & Synced
                              </div>

                              {/* Star Rating feedback loop on returned items */}
                              {!ratedTxIds[tx.id] ? (
                                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-inner">
                                  <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
                                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Review & Rate {counterpart.fullName}
                                  </h4>
                                  <p className="text-xs text-slate-500 mb-4">Your rating directly influences their campus trust score and lend qualification limit.</p>
                                  
                                  <div className="flex gap-2 items-center mb-4">
                                    {[1, 2, 3, 4, 5].map(val => (
                                      <button 
                                        key={val}
                                        type="button"
                                        onClick={() => setRatingScore(val)}
                                        className="focus:outline-none transition-transform active:scale-95"
                                      >
                                        <Star className={`w-7 h-7 ${val <= ratingScore ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                      </button>
                                    ))}
                                    <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md ml-2">
                                      {ratingScore === 5 ? 'Excellent ⭐ 5/5' :
                                       ratingScore === 4 ? 'Very Good ⭐ 4/5' :
                                       ratingScore === 3 ? 'Good ⭐ 3/5' :
                                       ratingScore === 2 ? 'Fair ⭐ 2/5' : 'Needs Work ⭐ 1/5'}
                                    </span>
                                  </div>
                                  
                                  <div className="mb-4">
                                    <textarea 
                                      rows={2}
                                      placeholder={`Write a quick review about ${counterpart.fullName} (e.g. Prompt handoff, clean item)...`}
                                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                                      value={ratingComment}
                                      onChange={e => setRatingComment(e.target.value)}
                                    />
                                  </div>
                                  
                                  <button 
                                    onClick={() => handleSubmitRating(tx, counterpart)}
                                    className="w-full bg-gradient-to-r from-amber-500 to-primary-600 hover:from-amber-600 hover:to-primary-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                                  >
                                    Submit Review & Boost Trust Score
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 text-center">
                                  <p className="text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Review Submitted Successfully! Trust Score Synced.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {myTransactions.length === 0 && (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 px-6 text-center shadow-sm">
                      <p className="text-slate-400 text-sm font-medium">No active borrows or lends found. Accept an offer to start!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ALERTS / LIVE NOTIFICATIONS */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Notification History</h2>
                  <p className="text-sm text-slate-500 mt-1">Review WebSocket-triggered real-time events and peer matching pings.</p>
                </div>

                <div className="space-y-3">
                  {notifications.map((n, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow animate-slide-in">
                      <div className={`p-2.5 rounded-xl ${
                        n.type === 'NEW_REQUEST_NEARBY' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                        n.type === 'NEW_OFFER' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
                        n.type === 'OFFER_ACCEPTED' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                        'bg-indigo-50 text-indigo-500 border border-indigo-100'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{n.type?.replace('_', ' ') || ''}</span>
                          <span className="text-[10px] text-slate-400">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 px-6 text-center shadow-sm">
                      <p className="text-slate-400 text-sm font-medium">No alerts received in this session yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar - Stats & Live Pinned Feed */}
          <div className="w-full lg:w-80 space-y-6">
            
            {/* Karma points with animated progression levels */}
            <div className="bg-gradient-to-tr from-primary-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
              <h3 className="text-xs font-medium bg-white/20 w-fit px-3 py-1 rounded-full flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-300 animate-bounce" /> {karmaLevel.title}
              </h3>
              
              <div className="mt-6 mb-2 flex justify-between items-baseline">
                <p className="text-4xl font-extrabold tracking-tight">{karmaPoints} <span className="text-xs font-normal text-indigo-200">Karma</span></p>
                <p className="text-xs text-indigo-100 font-semibold">{karmaLevel.progress.toFixed(0)}% level up</p>
              </div>

              {/* level progression bar */}
              <div className="w-full h-2 bg-indigo-950/40 rounded-full overflow-hidden mb-4 border border-indigo-200/10">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-inner"
                  style={{ width: `${karmaLevel.progress}%` }}
                />
              </div>

              <p className="text-[11px] text-indigo-100 leading-normal">
                Completed: <span className="font-bold text-white">{completedLends} Lends</span> (+50 pts ea) & <span className="font-bold text-white">{completedBorrows} Borrows</span> (+15 pts ea).
              </p>
              
              <button disabled className="w-full bg-white text-indigo-900 hover:bg-slate-50 transition-all rounded-2xl py-3 text-xs font-bold mt-6 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Redeem Campus Rewards
              </button>
            </div>
            
            {/* auto scrolling glassmorphic campus stream */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
                Live Campus Stream
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {notifications.map((n, i) => (
                  <div key={i} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0 animate-slide-in">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 mt-1 shrink-0 shadow shadow-indigo-300" />
                    <div>
                      <p className="text-xs font-medium text-slate-700 leading-snug">{n.message}</p>
                      <span className="text-[8px] text-slate-400 font-bold block mt-0.5">{n.type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No stream events received in this session.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Action Button (Post Request) */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-tr from-primary-600 to-indigo-600 text-white rounded-full shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* POST REQUEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-950 mb-1">I Need An Item</h2>
            <p className="text-xs text-slate-500 mb-6">Describe what you need. Everyone having the platform will be notified.</p>
            
            <form onSubmit={handlePostRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">What do you need?</label>
                <input 
                  required 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm bg-slate-50/50" 
                  placeholder="E.g., USB-C MacBook Charger" 
                  value={newReq.title} 
                  onChange={e=>setNewReq({...newReq, title:e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Context & Explanation</label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm bg-slate-50/50" 
                  placeholder="My laptop has 5% charge left, doing my final year project. Urgent help needed!" 
                  value={newReq.description} 
                  onChange={e=>setNewReq({...newReq, description:e.target.value})} 
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Urgency Level</label>
                  <select 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm outline-none" 
                    value={newReq.urgency} 
                    onChange={e=>setNewReq({...newReq, urgency:e.target.value})}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">For (Hours)</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm outline-none" 
                    value={newReq.durationHours} 
                    onChange={e=>setNewReq({...newReq, durationHours:parseInt(e.target.value) || 2})} 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 bg-white text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/10 hover:from-primary-700 hover:to-indigo-700">Post Query</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-950 mb-1">Offer Help</h2>
            <p className="text-xs text-slate-500 mb-6">Let the student know you have this item and where you can meet.</p>
            
            <form onSubmit={handlePostOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Offer Message</label>
                <textarea 
                  required 
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm bg-slate-50/50" 
                  placeholder="Where can they collect it? When are you free?" 
                  value={offerMessage} 
                  onChange={e=>setOfferMessage(e.target.value)} 
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 border border-slate-200 bg-white text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button 
                  type="submit" 
                  disabled={submittingOffer}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/10 hover:from-primary-700 hover:to-indigo-700 flex items-center justify-center gap-1.5"
                >
                  {submittingOffer ? 'Submitting...' : 'Send Offer'} <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-in flex items-start gap-3 bg-white/95 border-slate-200/80 transition-all duration-300"
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${
              t.type === 'NEW_OFFER' || t.type === 'OFFER' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
              t.type === 'OFFER_ACCEPTED' || t.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
              t.type === 'CHAT' ? 'bg-indigo-50 text-indigo-500 border border-indigo-100' :
              t.type === 'HANDOFF_CONFIRMED' || t.type === 'ITEM_RETURNED' ? 'bg-primary-50 text-primary-500 border border-primary-100' :
              'bg-rose-50 text-rose-500 border border-rose-100'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t.type?.replace('_', ' ') || 'ALERT'}</p>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-600 focus:outline-none">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      
    </div>
  );
};

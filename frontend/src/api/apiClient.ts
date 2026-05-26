import axios from 'axios';

// Base URL for API (Relative in production for integrated Spring Boot server, absolute for Vite dev)
const API_BASE_URL = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const UserService = {
    register: (userData: any) => apiClient.post('/users/register', userData),
    getUser: (id: string) => apiClient.get(`/users/${id}`),
};

export const RequestService = {
    getFeed: () => apiClient.get('/requests'),
    createRequest: (requestData: any, requesterId: string) => apiClient.post(`/requests?requesterId=${requesterId}`, requestData),
    makeOffer: (requestId: string, offerData: any, lenderId: string) => apiClient.post(`/requests/${requestId}/offers?lenderId=${lenderId}`, offerData),
    getOffers: (requestId: string) => apiClient.get(`/requests/${requestId}/offers`),
    acceptOffer: (requestId: string, offerId: string) => apiClient.put(`/requests/${requestId}/offers/${offerId}/accept`),
};

export const TransactionService = {
    getMyTransactions: (userId: string) => apiClient.get(`/transactions/user/${userId}`),
    updateTransactionStatus: (id: string, status: string) => apiClient.put(`/transactions/${id}/status`, { status }),
};

import axios from 'axios';

// Base URL for API
const API_BASE_URL = 'http://localhost:8080/api/v1';

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
    acceptOffer: (requestId: string, offerId: string) => apiClient.put(`/requests/${requestId}/offers/${offerId}/accept`),
};

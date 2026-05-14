import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const path = window.location.pathname;
            const reqUrl = error.config?.url || '';
            // Don't redirect on auth pages, landing page, or initial token validation
            if (path !== '/login' && path !== '/register' && path !== '/' && reqUrl !== '/auth/me') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getProfile = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const uploadProfilePhoto = (formData) => API.post('/auth/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const PHOTO_BASE_URL = 'http://localhost:5000/api/auth/uploads';

// Admin
export const createFaculty = (data) => API.post('/admin/faculty', data);
export const getUsers = (role) => API.get('/admin/users', { params: { role } });
export const getAdminExams = () => API.get('/admin/exams');
export const getProctoringLogs = (params) => API.get('/admin/proctoring-logs', { params });
export const getAdminStats = () => API.get('/admin/stats');

// Faculty
export const createExam = (data) => API.post('/faculty/exams', data);
export const getFacultyExams = () => API.get('/faculty/exams');
export const getExamDetails = (id) => API.get(`/faculty/exams/${id}`);
export const updateExam = (id, data) => API.put(`/faculty/exams/${id}`, data);
export const deleteExam = (id) => API.delete(`/faculty/exams/${id}`);
export const addMCQQuestion = (examId, data) => API.post(`/faculty/exams/${examId}/mcq`, data);
export const deleteMCQQuestion = (id) => API.delete(`/faculty/mcq/${id}`);
export const addCodingQuestion = (examId, data) => API.post(`/faculty/exams/${examId}/coding`, data);
export const deleteCodingQuestion = (id) => API.delete(`/faculty/coding/${id}`);
export const addTestCase = (questionId, data) => API.post(`/faculty/coding/${questionId}/testcases`, data);
export const deleteTestCase = (id) => API.delete(`/faculty/testcases/${id}`);
export const getExamResults = (examId) => API.get(`/faculty/exams/${examId}/results`);
export const getStudents = () => API.get('/faculty/students');
export const getExamAssignments = (examId) => API.get(`/faculty/exams/${examId}/assignments`);
export const assignExamToStudents = (examId, data) => API.post(`/faculty/exams/${examId}/assign`, data);

// AI Generation
export const generateQuestions = (data) => API.post('/ai/generate-questions', data);
export const saveAIQuestions = (data) => API.post('/ai/save-questions', data);

// Student
export const getStudentExams = () => API.get('/student/exams');
export const getStudentExamDetails = (id) => API.get(`/student/exams/${id}`);
export const submitMCQExam = (examId, data) => API.post(`/student/exams/${examId}/submit-mcq`, data);
export const runCode = (data) => API.post('/student/code/run', data);
export const submitCode = (data) => API.post('/student/code/submit', data);
export const getStudentResults = () => API.get('/student/results');
export const getAnswerKey = (examId) => API.get(`/student/results/${examId}/answer-key`);
export const sendProctorFrame = (data) => API.post('/student/proctor', data);

// Monitor / Live Sessions
export const startSession = (data) => API.post('/monitor/start-session', data);
export const endSession = (data) => API.post('/monitor/end-session', data);
export const checkSession = (examId) => API.get('/monitor/check-session', { params: { exam_id: examId } });
export const getActiveSessions = (examId) => API.get(`/monitor/active-sessions/${examId}`);
export const getAllSessions = (examId) => API.get(`/monitor/sessions/${examId}`);
export const sendWarning = (data) => API.post('/monitor/send-warning', data);
export const terminateSession = (data) => API.post('/monitor/terminate-session', data);
export const reopenSession = (data) => API.post('/monitor/reopen-session', data);
export const getChat = (sessionId) => API.get(`/monitor/chat/${sessionId}`);
export const sendChatMessage = (data) => API.post('/monitor/chat', data);

export default API;

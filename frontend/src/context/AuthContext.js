import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  userType: null, // 'teacher' or 'student'
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        userType: action.payload.userType,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        userType: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        userType: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session on app load
    const savedAuth = localStorage.getItem('authData');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: authData,
        });
      } catch (error) {
        localStorage.removeItem('authData');
        dispatch({ type: 'AUTH_ERROR' });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loginStudent = async (studentId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.loginStudent(studentId);
      
      if (response.data.success) {
        const authData = {
          user: response.data.user || response.data.data,
          userType: 'student',
        };
        
        localStorage.setItem('authData', JSON.stringify(authData));
        dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
        return { success: true };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      return { 
        success: false, 
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
      };
    }
  };

  const loginTeacher = async (username, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.loginTeacher(username, password);
      
      if (response.data.success) {
        const authData = {
          user: { username },
          userType: 'teacher',
        };
        
        localStorage.setItem('authData', JSON.stringify(authData));
        dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
        return { success: true };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      return { 
        success: false, 
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authData');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    loginStudent,
    loginTeacher,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
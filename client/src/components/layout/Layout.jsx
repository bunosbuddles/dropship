import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import FeedbackButton from './FeedbackButton';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'home' },
    { name: 'Products', path: '/products', icon: 'box' },
    { name: 'Content Dashboard', path: '/content-dashboard', icon: 'video' },
    { name: 'Content Calendar', path: '/calendar', icon: 'calendar' },
    { name: 'Goals', path: '/goals', icon: 'target' },
    { name: 'Sourcing', path: '/sourcing', icon: 'factory' }
  ];

  // Add superuser option if user has superuser role
  if (user && user.role === 'superuser') {
    navLinks.push({ name: 'Superuser', path: '/superuser', icon: 'admin' });
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Helper function to get icon JSX based on name
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        );
      case 'box':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'target':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        );
      case 'admin':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      case 'factory':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 13.5V17a1 1 0 001 1h14a1 1 0 001-1v-7.382a1 1 0 00-1.447-.894L13 10.118V7.382a1 1 0 00-1.447-.894L9 7.882V3.5a1 1 0 00-1-1H4a1 1 0 00-1 1v10z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Dropship Analytics</h1>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {/* User dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`${
                  location.pathname === link.path
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <span className="mr-2">{getIcon(link.icon)}</span>
                  {link.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-grow">
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:block w-64 bg-white shadow-md">
          <div className="px-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`${
                  location.pathname === link.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1`}
              >
                <span className="mr-3">{getIcon(link.icon)}</span>
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </div>
      
      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default Layout;
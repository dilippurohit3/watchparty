import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-500 mb-4">404</div>
          <div className="w-24 h-1 bg-primary-500 mx-auto rounded"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <p className="text-sm text-secondary-500 dark:text-secondary-500">
            The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary btn-lg w-full flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline w-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-secondary-500 dark:text-secondary-400">
          <p>
            If you think this is an error, please{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500 transition-colors">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

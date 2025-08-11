import React from 'react';

const Card = ({ children, className = '', padding = true, onClick, ...props }) => {
  const paddingClass = padding ? 'p-6' : '';
  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg ${paddingClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-medium text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Title = CardTitle;

export default Card;
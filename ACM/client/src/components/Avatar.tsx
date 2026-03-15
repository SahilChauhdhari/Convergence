import React from 'react';

interface AvatarProps {
  src?: string;
  fallback: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, fallback, className = "w-10 h-10" }) => (
  <div className={`relative shrink-0 ${className}`}>
    <img
      src={src || `https://ui-avatars.com/api/?name=${fallback}&background=6366f1&color=fff`}
      alt="Avatar"
      className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
    />
  </div>
);

export default Avatar;

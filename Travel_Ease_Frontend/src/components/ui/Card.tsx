import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
        {...props}
      >
        <div className={noPadding ? '' : 'p-5'}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;







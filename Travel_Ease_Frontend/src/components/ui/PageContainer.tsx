import React, { HTMLAttributes, forwardRef } from 'react';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Use full width (no max-width constraint) */
  fullWidth?: boolean;
  /** Remove default vertical padding */
  noPaddingY?: boolean;
  /** Use narrower max-width for forms/content pages */
  narrow?: boolean;
  /** Background color class */
  bg?: 'white' | 'gray' | 'transparent';
}

/**
 * PageContainer - A standard centered container for page content.
 * Enforces consistent horizontal padding and max-width across all pages.
 */
const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ 
    className = '', 
    fullWidth = false, 
    noPaddingY = false,
    narrow = false,
    bg = 'transparent',
    children, 
    ...props 
  }, ref) => {
    
    const bgClasses = {
      white: 'bg-white',
      gray: 'bg-gray-50',
      transparent: '',
    };

    const maxWidthClass = fullWidth 
      ? '' 
      : narrow 
        ? 'max-w-4xl' 
        : 'max-w-7xl';

    const paddingY = noPaddingY ? '' : 'py-6 sm:py-8 lg:py-10';

    return (
      <div
        ref={ref}
        className={`
          mx-auto 
          px-4 sm:px-6 lg:px-8 
          ${maxWidthClass} 
          ${paddingY}
          ${bgClasses[bg]}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PageContainer.displayName = 'PageContainer';

export default PageContainer;


import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="border-t-2 border-secondary-blue w-24 mx-auto mb-6"></div>
        <h1 className="text-5xl font-bold text-secondary-blue mb-6">{title}</h1>
        <div className="border-t-2 border-secondary-blue w-24 mx-auto mb-6"></div>
        {subtitle && (
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;



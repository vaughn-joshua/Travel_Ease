import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 w-24 border-t-2 border-primary-red" />
        <h1 className="mb-6 text-5xl font-bold text-primary-red">{title}</h1>
        <div className="mx-auto mb-6 w-24 border-t-2 border-primary-red" />
        {subtitle && (
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;



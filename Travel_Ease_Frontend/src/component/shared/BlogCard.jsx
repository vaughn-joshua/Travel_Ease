function BlogCard({ image, category, title, description, author, date, readTime, href = "#" }) {
  return (
    <a
      href={href}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Category Chip */}
        {category && (
          <span className="inline-block px-2 sm:px-3 py-1 bg-[#E10600] text-white text-xs font-semibold tracking-wider uppercase rounded-full mb-2 sm:mb-3">
            {category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#E10600] transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
          {author && <span>By {author}</span>}
          {date && <span>{date}</span>}
          {readTime && <span>{readTime} min read</span>}
        </div>

        {/* Read More */}
        <div className="mt-3 sm:mt-4 text-[#E10600] font-semibold text-xs sm:text-sm group-hover:underline">
          Read More &gt;
        </div>
      </div>
    </a>
  );
}

export default BlogCard;


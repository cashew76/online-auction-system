import React from "react";
import { Link } from "react-router";

export const CTA = () => {
  return (
    <section className="relative overflow-hidden py-1 sm:py-1">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Start Bidding?
        </h2>
        <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
          Join our community today and fairly distribute your items. 
		  Getting started takes seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-all shadow-sm"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  );
};

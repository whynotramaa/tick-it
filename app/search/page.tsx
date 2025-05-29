import { Suspense } from "react";
import SearchPage from "./SearchPage"; // adjust if needed

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading search results...</div>}>
      <SearchPage />
    </Suspense>
  );
}

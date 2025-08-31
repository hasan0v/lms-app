import dynamic from 'next/dynamic'

// Lazy load the RichTextEditor to reduce initial bundle size
const LazyRichTextEditor = dynamic(() => import('./RichTextEditor'), {
  loading: () => (
    <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading editor...</div>
    </div>
  ),
  ssr: false
})

export default LazyRichTextEditor
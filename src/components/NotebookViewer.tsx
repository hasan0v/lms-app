'use client'

import React from 'react'

const NotebookViewer: React.FC<{ notebookData?: unknown }> = () => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Notebook Viewer
      </h3>
      <p className="text-gray-600">
        Notebook viewer komponenti hazırlanır...
      </p>
    </div>
  )
}

export default NotebookViewer
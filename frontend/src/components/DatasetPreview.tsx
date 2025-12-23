import { useState, useEffect } from 'react';

interface DatasetPreviewProps {
  file: File | null;
  csvData?: string;
  onSelectDifferent?: () => void;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const DatasetPreview = ({ file, csvData, onSelectDifferent }: DatasetPreviewProps) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const maxPreviewRows = 10;

  useEffect(() => {
    const loadPreview = async () => {
      if (!file && !csvData) {
        setPreviewData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let text: string;
        
        if (csvData) {
          text = csvData;
        } else if (file) {
          text = await file.text();
        } else {
          return;
        }

        // Parse CSV
        const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 0) {
          throw new Error('File is empty');
        }

        // Helper function to parse CSV line
        const parseCSVLine = (line: string): string[] => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        };

        // Parse headers
        const headers = parseCSVLine(lines[0]);
        
        // Parse rows (limit to maxPreviewRows for preview)
        const rowsToShow = showAllRows ? lines.length - 1 : Math.min(maxPreviewRows, lines.length - 1);
        const rows = lines.slice(1, rowsToShow + 1).map(line => parseCSVLine(line));

        setPreviewData({
          headers,
          rows,
          totalRows: lines.length - 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse dataset');
        setPreviewData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [file, csvData, showAllRows]);

  if (!file && !csvData) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-6 card p-8">
        <div className="flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-[var(--primary)] animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[var(--text-secondary)]">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 card p-4">
        <div className="flex items-center gap-3 text-[var(--error)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Dataset Preview</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {previewData.totalRows.toLocaleString()} rows × {previewData.headers.length} columns
          </p>
        </div>
        {previewData.totalRows > maxPreviewRows && (
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-elevated)]"
          >
            {showAllRows ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Show All ({previewData.totalRows} rows)
              </>
            )}
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table 
          className="min-w-full divide-y divide-[var(--border)]"
          role="table"
          aria-label="Dataset preview table"
        >
          <thead className="bg-[var(--bg-elevated)]">
            <tr>
              {previewData.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                >
                  <span className="truncate block max-w-[200px]" title={header}>
                    {header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-card)] divide-y divide-[var(--border)]">
            {previewData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-[var(--text-primary)]"
                  >
                    <div 
                      className="max-w-[250px] truncate" 
                      title={cell || 'Empty cell'}
                    >
                      {cell || <span className="text-[var(--text-muted)] italic">—</span>}
                    </div>
                  </td>
                ))}
                {/* Fill empty cells if row has fewer values than headers */}
                {row.length < previewData.headers.length &&
                  Array.from({ length: previewData.headers.length - row.length }).map((_, i) => (
                    <td
                      key={`empty-${i}`}
                      className="px-4 py-3 text-sm text-[var(--text-muted)] italic"
                    >
                      —
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewData.rows.length < previewData.totalRows && !showAllRows && (
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {previewData.rows.length} of {previewData.totalRows} rows
          </p>
        </div>
      )}
    </div>
  );
};


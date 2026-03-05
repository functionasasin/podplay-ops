/**
 * DocumentChecklist — Per-case document checklist panel (§4.22)
 */

import { useState, useEffect } from 'react';
import type { CaseDocument, DocumentProgress } from '@/types';
import { listDocuments, computeProgress, checkOffDocument, markNotApplicable } from '@/lib/documents';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentChecklistProps {
  caseId: string;
  userId: string;
}

export function DocumentChecklist({ caseId }: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [progress, setProgress] = useState<DocumentProgress>({ obtained: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const docs = await listDocuments(caseId);
      setDocuments(docs);
      setProgress(computeProgress(docs));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOff(docId: string, date: string, note?: string) {
    await checkOffDocument(docId, date, note);
    await loadDocuments();
  }

  async function handleMarkNA(docId: string) {
    await markNotApplicable(docId);
    await loadDocuments();
  }

  if (loading) {
    return (
      <div data-testid="document-checklist-loading" className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div data-testid="document-checklist">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Documents</h3>
        <span className="text-sm text-muted-foreground">
          {progress.obtained} of {progress.total} obtained ({progress.percentage}%)
        </span>
      </div>

      <div className="w-full bg-secondary rounded-full h-2 mb-4">
        <div
          className="bg-primary rounded-full h-2"
          style={{ width: `${progress.percentage}%` }}
          data-testid="progress-bar"
        />
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border rounded-lg"
            data-testid={`document-row-${doc.document_key}`}
          >
            <div className="flex items-center gap-2">
              {doc.is_not_applicable ? (
                <span className="text-muted-foreground" data-testid="na-badge">N/A</span>
              ) : doc.is_obtained ? (
                <span className="text-green-600" data-testid="obtained-badge">✓</span>
              ) : (
                <span className="text-muted-foreground" data-testid="pending-badge">○</span>
              )}
              <div>
                <span className={doc.is_not_applicable ? 'line-through text-muted-foreground' : ''}>
                  {doc.label}
                </span>
                {doc.obtained_date && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Obtained: {doc.obtained_date}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {!doc.is_obtained && !doc.is_not_applicable && (
                <>
                  <button
                    onClick={() => handleCheckOff(doc.id, new Date().toISOString().slice(0, 10))}
                    data-testid={`check-off-${doc.document_key}`}
                  >
                    Check Off
                  </button>
                  <button
                    onClick={() => handleMarkNA(doc.id)}
                    data-testid={`mark-na-${doc.document_key}`}
                  >
                    N/A
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

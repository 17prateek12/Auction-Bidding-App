import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

const PastEventPage = () => {
  return (
    <div className="px-4 sm:px-8 py-8 w-full min-h-screen text-white space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
        <Link href="/event-page">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Events Dashboard
        </Link>
      </Button>

      <div className="p-8 rounded-2xl bg-gray-900 border border-gray-700 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-gray-100">Past & Completed Event Analytics</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Review finalized reverse-auction results, participant rank summaries, and interactive Gemini AI analytics.
        </p>
      </div>
    </div>
  );
};

export default PastEventPage;

'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SchemaWithCount } from '@/hooks/use-schemas';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SchemaDetailSheet({ schema, onOpenChange }: { schema: SchemaWithCount | null; onOpenChange: (open: boolean) => void; }) {
  if (!schema) return null;
  const parametersJson = schema.parameters ? JSON.stringify(schema.parameters, null, 2) : "{}";
  return (
    <Sheet open={!!schema} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-mono">{schema.schemaId}</SheetTitle>
          <SheetDescription>{schema.description}</SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <h3 className="text-lg font-semibold mb-2">Schema Parameters</h3>
          <div className="rounded-md bg-muted text-sm max-h-96 overflow-auto">
            <SyntaxHighlighter language="json" style={vscDarkPlus} showLineNumbers>
              {parametersJson}
            </SyntaxHighlighter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { analyzeResume } from "@/actions/resume";
import Link from "next/link";

export default function UploadResumePage() {
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const fileInputRef = useRef(null);

  const { loading, fn: analyzeFn, data, error } = useFetch(analyzeResume);

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = ["text/plain", "text/markdown", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name?.toLowerCase().endsWith('.docx')) {
      toast.error("Only .txt, .md, .pdf or .docx files are supported. PDF/DOCX will be parsed server-side.");
      return;
    }

    setFileName(file.name);

    // If PDF or DOCX, upload to server parse endpoint
    if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.toLowerCase().endsWith('.docx')) {
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/parse-document', { method: 'POST', body: form });
        const json = await res.json();
        if (json.error) {
          toast.error(json.error || 'Failed to parse document');
          return;
        }
        setContent(json.text || '');
        await analyzeFn(json.text || '');
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse file');
      }

      return;
    }

    // Plain text / markdown
    const text = await file.text();
    setContent(text);
    try {
      await analyzeFn(text);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>Upload your existing resume (PDF, DOCX, text, or markdown) and get an AI-powered ATS analysis tailored to your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose file to upload
              </Button>
              {fileName && <p className="mt-2 text-sm">Selected: {fileName}</p>}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Or paste your resume text below and click Analyze.</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => analyzeFn(content)} disabled={loading || !content}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
              <Link href="/resume">
                <Button variant="ghost">Back to Resume Builder</Button>
              </Link>
            </div>

            {data && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold">ATS Score: {data.atsScore}</h3>
                {data.issues?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Issues</p>
                    <ul className="list-disc list-inside text-sm">
                      {data.issues.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.suggestions?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Suggestions</p>
                    <ul className="list-disc list-inside text-sm">
                      {data.suggestions.map((s, idx) => (
                        <li key={idx}><strong>{s.area}:</strong> {s.advice}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.improvedSummary && (
                  <div className="mt-2">
                    <p className="font-medium">Improved Summary</p>
                    <p className="text-sm">{data.improvedSummary}</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Failed to analyze resume</p>
                <p className="text-red-600 text-sm mt-1">{error.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

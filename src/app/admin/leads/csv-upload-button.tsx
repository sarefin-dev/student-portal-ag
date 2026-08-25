'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { createLeadsBulk } from './actions';

function parseCSV(text: string) {
  const result = [];
  let row = [];
  let inQuotes = false;
  let val = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      val += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(val.trim());
      val = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(val.trim());
      result.push(row);
      row = [];
      val = '';
    } else if (char !== '\r') {
      val += char;
    }
  }
  row.push(val.trim());
  if (row.length > 0 || val) result.push(row);
  return result.filter(r => r.length > 1 || r[0] !== '');
}

export function CsvUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error('CSV is empty or missing headers');

      const headers = rows[0].map((h: string) => h.trim().toLowerCase().replace(/^\uFEFF/, ''));
      
      const leads = [];
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        
        const lead: any = { status: 'new', name: '', email: null, phone: null, source: 'Manual', interested_in: null, notes: null };
        
        headers.forEach((header: string, index: number) => {
          let val = values[index];
          if (!val) return;
          
          if (header === 'name' || header === 'full_name') lead.name = val;
          if (header === 'email') lead.email = val;
          if (header === 'phone') lead.phone = val.replace(/^p:/i, '');
          if (header === 'source' || header === 'platform') lead.source = val;
          if (header === 'interest' || header === 'form_name') lead.interested_in = val;
          if (header === 'notes') lead.notes = val;
        });

        if (lead.name) {
          leads.push(lead);
        }
      }

      if (leads.length > 0) {
        const result = await createLeadsBulk(leads);
        if (result.success) {
          alert("Successfully imported ${leads.length} leads!");
        } else {
          alert("Import failed: ${result.error}");
        }
      } else {
        alert("No valid leads found. Please ensure the CSV has a 'Name' or 'FULL_NAME' column.");
      }
    } catch (error) {
      console.error(error);
      alert('Failed to parse or upload CSV.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button 
        variant="outline" 
        size="icon" 
        className="h-9 w-9"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title="Upload CSV (Supports FB Lead Ads format)"
      >
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
      </Button>
    </>
  );
}

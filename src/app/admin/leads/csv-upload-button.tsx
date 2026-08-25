'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { createLeadsBulk } from './actions';

export function CsvUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Assumes format: Name, Email, Phone, Source, Interest, Notes
      // Using a simple split for now. Does not handle commas inside quotes.
      // If they need robust parsing, we can add a lightweight parser.
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const leads = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const lead: any = { status: 'new' };
        
        headers.forEach((header, index) => {
          if (header === 'name') lead.name = values[index];
          if (header === 'email') lead.email = values[index];
          if (header === 'phone') lead.phone = values[index];
          if (header === 'source') lead.source = values[index];
          if (header === 'interest') lead.interested_in = values[index];
          if (header === 'notes') lead.notes = values[index];
        });

        if (lead.name) {
          leads.push(lead);
        }
      }

      if (leads.length > 0) {
        await createLeadsBulk(leads);
        alert("Successfully imported ${leads.length} leads!");
      } else {
        alert("No valid leads found. Please ensure the CSV has a 'Name' column.");
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
        title="Upload CSV (Columns: Name, Email, Phone, Source, Interest, Notes)"
      >
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
      </Button>
    </>
  );
}

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Eye,
  Search,
  Loader2,
  Play,
  Monitor,
  Smartphone,
  X,
  Send,
} from 'lucide-react';

// --- Email Template Interface ---
interface EmailTemplate {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: 'notification' | 'marketing' | 'transactional' | 'other';
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const statusFilter = '';

  // Modal States
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'view' | 'preview' | null>(null);

  const fetchTemplates = useMemo(() => async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('isActive', statusFilter === 'active' ? 'true' : 'false');

      const response = await fetch(`/api/admin/email-templates?${params}`);
      const data = await response.json();
      if (data.success) setTemplates(data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    if (status !== 'loading' && session?.user?.role === 'admin') {
      fetchTemplates();
    }
  }, [status, session, fetchTemplates]);

  if (status === 'loading') return <div className="p-6">Verifying Access...</div>;
  if (!session || session.user.role !== 'admin') redirect('/forbidden');

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTemplate(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
          <p className="text-gray-500">Design and test system communications.</p>
        </div>
        <button 
          onClick={() => setActiveModal('create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600"
        >
          <option value="">All Categories</option>
          <option value="transactional">Transactional</option>
          <option value="marketing">Marketing</option>
          <option value="notification">Notification</option>
        </select>
      </div>

      {/* Template Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Name & Subject</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {filteredTemplates.map((template) => (
              <tr key={template._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">{template.subject}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                    {template.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${template.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {template.isActive ? 'Active' : 'Inactive'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <ActionButton icon={<Eye />} onClick={() => { setSelectedTemplate(template); setActiveModal('view'); }} color="text-gray-400 hover:text-blue-600" />
                  <ActionButton icon={<Edit />} onClick={() => { setSelectedTemplate(template); setActiveModal('edit'); }} color="text-gray-400 hover:text-green-600" />
                  <ActionButton icon={<Play />} onClick={() => { setSelectedTemplate(template); setActiveModal('preview'); }} color="text-gray-400 hover:text-purple-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals Logic */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <TemplateFormModal
          template={selectedTemplate}
          onClose={closeModal}
          onSave={() => { closeModal(); fetchTemplates(); }}
        />
      )}
      {activeModal === 'view' && selectedTemplate && (
        <ViewModal template={selectedTemplate} onClose={closeModal} />
      )}
      {activeModal === 'preview' && selectedTemplate && (
        <PreviewAndTestModal template={selectedTemplate} onClose={closeModal} />
      )}
    </div>
  );
}

// --- Sub-Components ---

import { LucideProps } from 'lucide-react';

function ActionButton({ 
  icon, 
  onClick, 
  color 
}: { 
  icon: React.ReactElement<LucideProps>, // Explicitly define the icon type
  onClick: () => void, 
  color: string 
}) {
  return (
    <button 
      onClick={onClick} 
      className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition shadow-sm border border-transparent hover:border-gray-200 ${color}`}
    >
      {/* Type-safe cloning */}
      {React.cloneElement(icon, { size: 18 })}
    </button>
  );
}

function TemplateFormModal({ template, onClose, onSave }: { template: EmailTemplate | null; onClose: () => void; onSave: () => void; }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    htmlContent: template?.htmlContent || '',
    category: template?.category || 'notification',
    variables: template?.variables.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, variables: formData.variables.split(',').map(v => v.trim()).filter(Boolean) };
    const method = template ? 'PUT' : 'POST';
    const url = template ? `/api/admin/email-templates/${template._id}` : '/api/admin/email-templates';
    
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold">{template ? 'Edit' : 'Create'} Email Template</h2>
          <button type="button" onClick={onClose}><X /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Template Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as EmailTemplate['category']})} className="border rounded-lg p-2 dark:bg-slate-700">
                <option value="notification">Notification</option>
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>
          </div>
          <Input label="Email Subject" value={formData.subject} onChange={v => setFormData({...formData, subject: v})} />
          <Input label="Variables (comma separated)" value={formData.variables} onChange={v => setFormData({...formData, variables: v})} placeholder="name, role, date" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">HTML Content</label>
            <textarea 
              rows={10} 
              value={formData.htmlContent} 
              onChange={e => setFormData({...formData, htmlContent: e.target.value})} 
              className="border rounded-lg p-3 font-mono text-sm dark:bg-slate-900"
            />
          </div>
        </div>
        <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

function ViewModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold">View Email Template</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Template Name</label>
              <div className="border rounded-lg p-2 bg-gray-50 dark:bg-slate-700">{template.name}</div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Category</label>
              <div className="border rounded-lg p-2 bg-gray-50 dark:bg-slate-700 capitalize">{template.category}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">Email Subject</label>
            <div className="border rounded-lg p-2 bg-gray-50 dark:bg-slate-700">{template.subject}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">Variables</label>
            <div className="border rounded-lg p-2 bg-gray-50 dark:bg-slate-700">{template.variables.join(', ')}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">HTML Content</label>
            <textarea
              rows={10}
              value={template.htmlContent}
              readOnly
              className="border rounded-lg p-3 font-mono text-sm bg-gray-50 dark:bg-slate-900"
            />
          </div>
        </div>
        <div className="p-4 border-t dark:border-slate-700 flex justify-end bg-gray-50 dark:bg-slate-800/50">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}

function PreviewAndTestModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-generate preview content with dummy data
  const renderedHtml = useMemo(() => {
    let content = template.htmlContent;
    const dummyData: Record<string, string> = {
      name: 'John Doe',
      date: new Date().toLocaleDateString(),
      url: 'https://example.com',
      otp: '123456'
    };
    template.variables.forEach(v => {
      const regex = new RegExp(`{{${v}}}`, 'g');
      content = content.replace(regex, dummyData[v] || `[${v}]`);
    });
    return content;
  }, [template]);

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template._id, recipient: testEmail })
      });
      if (res.ok) alert('Test sent!');
      else alert('Failed to send test.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('desktop')} className={`p-2 rounded ${view === 'desktop' ? 'bg-blue-100 text-blue-600' : ''}`}><Monitor size={20}/></button>
            <button onClick={() => setView('mobile')} className={`p-2 rounded ${view === 'mobile' ? 'bg-blue-100 text-blue-600' : ''}`}><Smartphone size={20}/></button>
          </div>

          <div className="flex-1 max-w-md flex items-center gap-2">
            <input
              type="email"
              placeholder="Test recipient email..."
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm dark:bg-slate-700 dark:border-slate-600"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />}
              Send Test
            </button>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
        </div>

        <div className="flex-1 bg-gray-100 dark:bg-slate-900 p-8 overflow-y-auto">
          <div className={`bg-white shadow-lg mx-auto transition-all duration-300 ${view === 'mobile' ? 'max-w-[375px]' : 'max-w-2xl'}`} style={{ minHeight: '100%' }}>
            <iframe
              title="Preview"
              srcDoc={renderedHtml}
              className="w-full h-full min-h-[600px] border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase text-gray-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
      />
    </div>
  );
}

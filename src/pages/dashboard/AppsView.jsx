import React from 'react';
import { Download, Chrome, ExternalLink, Info } from 'lucide-react';

export default function AppsView({ t }) {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Apps & Integrations</h1>
                <p className="text-slate-500">Supercharge your workflow with our companion apps.</p>
            </div>

            {/* Featured App: Browser Extension */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                            <Chrome size={14} /> Browser Extension
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black leading-tight">
                            Capture Leads directly from your browser.
                        </h2>
                        <p className="text-indigo-200 text-lg max-w-xl leading-relaxed">
                            The DigiCard Companion extension lets you scrape contact info from any website, save leads instantly, and share your digital card with a single click.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <a
                                href="/extension.zip"
                                download="digicard-companion.zip"
                                className="flex items-center gap-3 bg-white text-indigo-900 px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-all transform hover:-translate-y-1 shadow-lg shadow-indigo-900/50"
                            >
                                <Download size={20} />
                                Download Extension
                            </a>
                        </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                    <Chrome size={24} className="text-white" />
                                </div>
                                <div>
                                    <div className="font-bold">DigiCard Companion</div>
                                    <div className="text-xs text-white/60">Version 1.0.0 • Manifest V3</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/80">Features:</div>
                                <ul className="text-sm text-indigo-200 space-y-1 list-disc list-inside">
                                    <li>Smart Lead Scraper</li>
                                    <li>Quick QR Code Share</li>
                                    <li>Task Management (Soon)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Installation Instructions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Info className="text-indigo-600" />
                    How to Install
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-black flex items-center justify-center">1</div>
                        <h4 className="font-bold text-slate-800">Download & Unzip</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Click the download button above. Extract the <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">extension.zip</code> file to a folder on your computer.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-black flex items-center justify-center">2</div>
                        <h4 className="font-bold text-slate-800">Open Extensions</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            In Chrome/Edge, go to <b>Extensions > Manage Extensions</b> through the menu, or type <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">chrome://extensions</code> in the address bar.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-black flex items-center justify-center">3</div>
                        <h4 className="font-bold text-slate-800">Load Unpacked</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Enable <b>"Developer mode"</b> (toggle in top right). Click <b>"Load unpacked"</b> and select the folder you extracted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

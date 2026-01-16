import React from 'react';
import LandingLayout from '../../layouts/LandingLayout';
import { useSEO } from '../../hooks/useSEO';

export default function Contact() {
    useSEO("Contact Us", "Get in touch with the DigiCard team for support or inquiries.");

    return (
        <LandingLayout>
            <div className="py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-slate-500">Have questions? We're here to help.</p>

                <form className="max-w-md mx-auto mt-10 text-left space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" className="w-full mt-1 p-3 rounded-lg border border-slate-300" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Message</label>
                        <textarea className="w-full mt-1 p-3 rounded-lg border border-slate-300" rows={4} placeholder="How can we help?"></textarea>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Send Message</button>
                </form>
            </div>
        </LandingLayout>
    );
}

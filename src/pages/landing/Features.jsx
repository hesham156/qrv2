import React from 'react';
import LandingLayout from '../../layouts/LandingLayout';
import { useSEO } from '../../hooks/useSEO';

export default function Features() {
    useSEO("Features", "Discover the powerful features that make DigiCard the best digital business card platform.");

    return (
        <LandingLayout>
            <div className="py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Powerful Features</h1>
                <p className="text-slate-500">Discover what makes DigiCard the best choice for professionals.</p>
                {/* Can expand this later */}
            </div>
        </LandingLayout>
    );
}

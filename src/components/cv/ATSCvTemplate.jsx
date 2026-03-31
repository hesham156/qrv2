import React from 'react';

export default function ATSCvTemplate({ data }) {
  if (!data) return null;

  return (
    <>
      <style>
        {`
          @media screen {
            #cv-print-container {
              display: none !important;
            }
          }
          @media print {
            body > *:not(#cv-print-container) {
              display: none !important;
            }
            #cv-print-container, #cv-print-container * {
              visibility: visible !important;
              color: #000 !important;
            }
            #cv-print-container {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            a {
              text-decoration: none !important;
              color: #000 !important;
            }
            @page {
              margin: 15mm;
            }
          }
        `}
      </style>
      <div 
        dir="auto" 
        className="w-full max-w-[850px] mx-auto bg-white text-black p-10 sm:p-12 text-left shadow-2xl relative"
        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
        {/* HEADER SECTION */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl capitalize font-bold mb-1 tracking-tight text-black">
            {data.name || 'Your Name'}
          </h1>
          {data.jobTitle && (
            <h2 className="text-[16px] sm:text-[18px] font-normal tracking-wide text-gray-700 mt-1">
              {data.jobTitle}
            </h2>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-gray-800 mt-3 font-medium">
            {data.email && (
              <span className="flex items-center gap-1">
                 {data.email}
              </span>
            )}
            {data.email && data.phone && <span className="text-gray-400">|</span>}
            {data.phone && (
              <span className="flex items-center gap-1">
                <span dir="ltr">{data.phone}</span>
              </span>
            )}
            {data.website && (
              <>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  {data.website.replace(/^https?:\/\//, '')}
                </span>
              </>
            )}
            {data.linkedin && (
              <>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  {data.linkedin}
                </span>
              </>
            )}
          </div>
        </div>

        {/* PROFESSIONAL SUMMARY / BIO */}
        {(data.bio_en || data.bio_ar || data.bio) && (
          <div className="mb-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider border-b-2 border-black pb-1 mb-3 text-black">
              Professional Summary
            </h3>
            <p className="text-[13px] leading-relaxed text-gray-900 whitespace-pre-line text-justify">
              {data.bio_en || data.bio_ar || data.bio}
            </p>
          </div>
        )}

        {/* WORK EXPERIENCE */}
        {data.experiences && data.experiences.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider border-b-2 border-black pb-1 mb-4 text-black">
              Professional Experience
            </h3>
            <div className="space-y-5">
              {data.experiences.map((exp, idx) => (
                <div key={exp.id || idx}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                    <div className="font-bold text-[14px] text-black capitalize">
                      {exp.title}
                    </div>
                    <div className="text-[13px] font-semibold text-gray-800 shrink-0">
                      {exp.startDate} – {exp.endDate || 'Present'}
                    </div>
                  </div>
                  <div className="text-[13.5px] italic text-gray-800 mb-1.5 capitalize">
                    {exp.company}
                  </div>
                  {exp.description && (
                    <ul className="list-disc leading-[1.6] ltr:ml-4 rtl:mr-4 text-[13px] text-gray-900 space-y-1">
                      {exp.description.split('\n').map((line, lIdx) => (
                        line.trim() ? <li key={lIdx} className="pl-1 rtl:pr-1">{line.trim()}</li> : null
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION */}
        {data.education && data.education.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider border-b-2 border-black pb-1 mb-4 text-black">
              Education
            </h3>
            <div className="space-y-4">
              {data.education.map((edu, idx) => (
                <div key={edu.id || idx}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-0.5">
                    <div className="font-bold text-[14px] text-black capitalize">{edu.degree}</div>
                    <div className="text-[13px] font-semibold text-gray-800 shrink-0">{edu.year}</div>
                  </div>
                  <div className="text-[13.5px] italic text-gray-800 capitalize">{edu.institution}</div>
                  {edu.description && <p className="text-[12.5px] mt-1 text-gray-700 leading-relaxed">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILLS */}
        {data.skills && data.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[14px] font-bold uppercase tracking-wider border-b-2 border-black pb-1 mb-3 text-black">
              Skills & Expertise
            </h3>
            <ul className="list-disc font-medium text-[13px] text-gray-900 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-1.5 gap-x-2 ltr:ml-4 rtl:mr-4">
              {data.skills.map((skill, idx) => (
                <li key={idx} className="pl-1 rtl:pr-1">{skill}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

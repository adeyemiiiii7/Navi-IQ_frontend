import jsPDF from 'jspdf';

/**
 * Exports the career assessment results to a PDF file
 * @param {object} resultsData - The career assessment results data
 */
export const exportToPDF = async (resultsData) => {
  try {
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;
    
    // Add Navi-IQ header
    pdf.setFillColor(79, 70, 229); // Blue color
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), 10, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('Navi-IQ Career Assessment Results', pageWidth / 2, yPosition + 6, { align: 'center' });
    
    yPosition += 20;
    
    // Add date
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 10;
    
    // Add user information if available
    if (resultsData.userName) {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(12);
      pdf.text(`Prepared for: ${resultsData.userName}`, margin, yPosition);
      yPosition += 10;
    }
    
    // Add section divider
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Add summary section
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(14);
    pdf.text('Assessment Summary', margin, yPosition);
    yPosition += 10;
    
    if (resultsData.summary) {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(11);
      
      // Handle text wrapping for summary
      const splitSummary = pdf.splitTextToSize(resultsData.summary, pageWidth - (margin * 2));
      pdf.text(splitSummary, margin, yPosition);
      yPosition += (splitSummary.length * 6) + 10;
    }
    
    // Add top career matches section
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(14);
    pdf.text('Top Career Matches', margin, yPosition);
    yPosition += 10;
    
    // Add career matches
    if (resultsData.recommendations && resultsData.recommendations.length > 0) {
      resultsData.recommendations.slice(0, 3).forEach((career, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Career title and match score
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(12);
        pdf.text(`${index + 1}. ${career.title}`, margin, yPosition);
        
        // Match score
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(79, 70, 229); // Blue color
        pdf.text(`${career.matchScore}% Match`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
        
        // Industry
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.text(`Industry: ${career.industry}`, margin, yPosition);
        yPosition += 6;
        
        // Description
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(10);
        const splitDescription = pdf.splitTextToSize(career.description, pageWidth - (margin * 2));
        pdf.text(splitDescription, margin, yPosition);
        yPosition += (splitDescription.length * 5) + 5;
        
        // Salary range and location
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Salary: ${career.salaryRange} | Location: ${career.location || 'Various'}`, margin, yPosition);
        yPosition += 5;
        
        // Required skills
        if (career.requiredSkills && career.requiredSkills.length > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(80, 80, 80);
          pdf.text('Key Skills:', margin, yPosition);
          yPosition += 5;
          
          pdf.setFont('helvetica', 'normal');
          const skills = career.requiredSkills.slice(0, 5).join(', ');
          const splitSkills = pdf.splitTextToSize(skills, pageWidth - (margin * 2));
          pdf.text(splitSkills, margin, yPosition);
          yPosition += (splitSkills.length * 5) + 10;
        } else {
          yPosition += 10;
        }
        
        // Add a divider between careers
        if (index < Math.min(2, resultsData.recommendations.length - 1)) {
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineDashPattern([1, 1], 0);
          pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
          yPosition += 5;
        }
      });
    }
    
    // Add strengths section if available
    if (resultsData.strengths && resultsData.strengths.length > 0) {
      // Check if we need a new page
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Add section divider
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDashPattern([], 0);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(14);
      pdf.text('Your Key Strengths', margin, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(11);
      
      resultsData.strengths.forEach((strength, index) => {
        pdf.text(`• ${strength}`, margin, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    }
    
    // Add development areas if available
    if (resultsData.developmentAreas && resultsData.developmentAreas.length > 0) {
      // Check if we need a new page
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(14);
      pdf.text('Areas for Development', margin, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(11);
      
      resultsData.developmentAreas.forEach((area, index) => {
        pdf.text(`• ${area}`, margin, yPosition);
        yPosition += 6;
      });
    }
    
    // Add footer
    const footerPosition = pdf.internal.pageSize.getHeight() - 10;
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text('Navi-IQ Career Assessment Platform', pageWidth / 2, footerPosition, { align: 'center' });
    
    // Save the PDF
    pdf.save(`navi-iq-career-results-${Date.now()}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Shares the career assessment results via the Web Share API
 * @param {object} resultsData - The career assessment results data
 */
export const shareResults = async (resultsData) => {
  try {
    // Check if Web Share API is available
    if (!navigator.share) {
      throw new Error('Web Share API not supported on this browser');
    }

    // Create share text
    const topCareer = resultsData.recommendations?.[0];
    const shareText = `I just completed my career assessment on Navi-IQ! My top career match is ${topCareer?.title} with a ${topCareer?.matchScore}% match score. Check out Navi-IQ to discover your own career path!`;
    
    // Share the results
    await navigator.share({
      title: 'My Navi-IQ Career Assessment Results',
      text: shareText,
      url: window.location.href,
    });
    
    return true;
  } catch (error) {
    console.error('Error sharing results:', error);
    
    // If Web Share API is not supported, create a fallback
    if (error.message === 'Web Share API not supported on this browser') {
      // Create a shareable link or text that can be copied to clipboard
      const topCareer = resultsData.recommendations?.[0];
      const shareText = `I just completed my career assessment on Navi-IQ! My top career match is ${topCareer?.title} with a ${topCareer?.matchScore}% match score. Check out Navi-IQ to discover your own career path!`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareText);
      return { fallback: true, message: 'Share text copied to clipboard!' };
    }
    
    throw error;
  }
};

/**
 * Creates a shareable link for the career assessment results
 * @param {string} sessionId - The session ID for the assessment
 * @returns {string} The shareable link
 */
export const createShareableLink = (sessionId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/results?session=${sessionId}`;
};

import html2canvas from 'html2canvas';

/**
 * Captures an HTML element and downloads it as a PNG file.
 * @param {string} elementId - The ID of the DOM element to capture.
 * @param {string} filename - The desired filename for the downloaded image.
 */
export const downloadElementAsPNG = async (elementId, filename = 'export') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }
  
  // Temporarily hide elements with the 'capture-exclude' class (e.g., download buttons)
  const excludeElements = element.querySelectorAll('.capture-exclude');
  const originalDisplays = [];
  excludeElements.forEach(el => {
    originalDisplays.push(el.style.display);
    el.style.display = 'none';
  });

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating PNG:', error);
  } finally {
    // Restore the excluded elements
    excludeElements.forEach((el, index) => {
      el.style.display = originalDisplays[index];
    });
  }
};

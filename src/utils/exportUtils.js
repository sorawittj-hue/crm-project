/**
 * Converts an array of objects to a CSV string.
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Optional array of header strings. If not provided, keys of the first object are used.
 * @returns {string} CSV formatted string
 */
export function jsonToCsv(data, headers = null) {
  if (!data || !data.length) return '';

  // Get headers from data keys if not provided
  const cols = headers || Object.keys(data[0]);

  // Construct CSV string
  const csvRows = [];
  
  // Add header row
  csvRows.push(cols.join(','));

  // Add data rows
  for (const row of data) {
    const values = cols.map(header => {
      let val = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // Escape quotes and wrap in quotes if there's a comma or newline
      val = val.toString().replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        val = `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }

  // Add BOM for Excel UTF-8 support
  return '\uFEFF' + csvRows.join('\n');
}

/**
 * Triggers a browser download of a CSV file.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the downloaded file (without .csv extension)
 * @param {Array} headers - Optional array of header strings
 */
export function downloadCsv(data, filename, headers = null) {
  const csvString = jsonToCsv(data, headers);
  if (!csvString) return;

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportSubscribersPDF(subscribers: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Subscribers", 14, 15);
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}  |  Total: ${subscribers.length}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Email", "First Name", "Last Name", "Status", "Date Added"]],
    body: subscribers.map((s) => [
      s.email,
      s.firstName || "",
      s.lastName || "",
      s.status,
      s.createdAt?.toDate
        ? s.createdAt.toDate().toLocaleDateString()
        : s.createdAt
        ? new Date(s.createdAt).toLocaleDateString()
        : "",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 0, 0] },
  });

  doc.save("subscribers.pdf");
}

export function exportWaitingListPDF(list: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Waiting List", 14, 15);
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}  |  Total: ${list.length}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Email", "Name", "Country", "City", "Region", "Date Added"]],
    body: list.map((w) => [
      w.email,
      w.name || "",
      w.country || "",
      w.city || "",
      w.region || "",
      w.createdAt?.toDate
        ? w.createdAt.toDate().toLocaleDateString()
        : w.createdAt
        ? new Date(w.createdAt).toLocaleDateString()
        : "",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 0, 0] },
  });

  doc.save("waiting-list.pdf");
}

export function exportFolderSubscribersPDF(folderName: string, subscribers: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Folder: ${folderName}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}  |  Total: ${subscribers.length}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Email", "First Name", "Last Name", "Status", "Date Added"]],
    body: subscribers.map((s) => [
      s.email,
      s.firstName || "",
      s.lastName || "",
      s.status || "",
      s.createdAt?.toDate
        ? s.createdAt.toDate().toLocaleDateString()
        : s.createdAt
        ? new Date(s.createdAt).toLocaleDateString()
        : "",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 0, 0] },
  });

  doc.save(`folder-${folderName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

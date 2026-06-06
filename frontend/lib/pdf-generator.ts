import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
// @ts-ignore - Use browser build to prevent Next.js from bundling Node's 'readline' module
import QRCode from "qrcode/build/qrcode"


interface Course {
  code: string
  name: string
  credits: number
  grade: string
}

interface TranscriptData {
  studentName: string
  studentId: string
  degree: string
  graduationDate: string
  courses: Course[]
  gpa: number
  universityName: string
  logoUrl?: string
  stampUrl?: string
  recordId: string
  verifierUrl: string
}

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to load image", url, err);
    return null;
  }
}

export const generateTranscriptPDF = async (data: TranscriptData): Promise<Blob> => {
  const doc = new jsPDF()

  // 1. Load Images
  const logoBase64 = data.logoUrl ? await fetchImageAsBase64(data.logoUrl) : null
  const stampBase64 = data.stampUrl ? await fetchImageAsBase64(data.stampUrl) : null

  // 2. Generate QR Code
  const qrDataUrl = await QRCode.toDataURL(data.verifierUrl, { errorCorrectionLevel: 'H', margin: 1 })

  // 3. Layout: Header
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 95, 10, 20, 20) // Centered-ish logo
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text(data.universityName, 105, 40, { align: "center" })
  } else {
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text(data.universityName, 105, 30, { align: "center" })
  }

  doc.setFontSize(16)
  doc.setFont("helvetica", "normal")
  doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 105, logoBase64 ? 50 : 40, { align: "center" })
  
  // 4. Layout: Student Details
  const startY = logoBase64 ? 65 : 55
  doc.setFontSize(11)
  doc.text(`Student Name: ${data.studentName}`, 20, startY)
  doc.text(`Student ID: ${data.studentId}`, 20, startY + 7)
  doc.text(`Degree Program: ${data.degree}`, 120, startY)
  doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 120, startY + 7)

  // 5. Layout: Table of Courses
  autoTable(doc, {
    startY: startY + 20,
    head: [['Course Code', 'Course Name', 'Credits', 'Grade']],
    body: data.courses.map(c => [c.code, c.name, c.credits.toString(), c.grade]),
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] }
  })

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || startY + 40

  // 6. Layout: GPA & Signature
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`Cumulative GPA: ${data.gpa.toFixed(2)}`, 20, finalY + 15)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("University Registrar", 140, finalY + 30)
  doc.line(130, finalY + 25, 180, finalY + 25) // Signature line

  if (stampBase64) {
    doc.addImage(stampBase64, "PNG", 140, finalY + 5, 30, 30)
  }

  // 7. Layout: Footer (QR Code & Verifier Info)
  doc.addImage(qrDataUrl, "PNG", 20, 260, 25, 25)
  doc.setFontSize(8)
  doc.text("Scan QR code to verify this transcript on-chain", 50, 270)
  doc.text(`Record ID: ${data.recordId}`, 50, 275)
  doc.text(`Verification URL: ${data.verifierUrl}`, 50, 280)

  return doc.output("blob")
}

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import QRCode from "qrcode"


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
  level?: string
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

  // 1. Draw Page Borders (Navy and Gold Theme)
  // Page size for A4: 210mm x 297mm
  doc.setDrawColor(11, 27, 60) // Deep Navy
  doc.setLineWidth(0.8)
  doc.rect(10, 10, 190, 277)

  doc.setDrawColor(197, 160, 89) // Rich Gold
  doc.setLineWidth(0.3)
  doc.rect(11.5, 11.5, 187, 274)

  // 2. Load Images
  const logoBase64 = data.logoUrl ? await fetchImageAsBase64(data.logoUrl) : null
  const stampBase64 = data.stampUrl ? await fetchImageAsBase64(data.stampUrl) : null

  // 3. Generate QR Code
  const qrDataUrl = await QRCode.toDataURL(data.verifierUrl, { errorCorrectionLevel: 'H', margin: 1 })

  // 4. Layout: Header & Title
  let currentY = 16
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 95, currentY, 20, 20) // Centered logo
    currentY += 25
  } else {
    currentY += 10
  }

  // Wrap long university names
  const wrappedUniversityName = doc.splitTextToSize(data.universityName.toUpperCase(), 160)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(11, 27, 60)
  doc.text(wrappedUniversityName, 105, currentY, { align: "center" })

  currentY += (wrappedUniversityName.length * 7) + 1
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(197, 160, 89) // Gold subtitle color
  doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 105, currentY, { align: "center" })

  // 5. Layout: Student Identification Card Box
  currentY += 6
  const cardY = currentY
  const cardHeight = 24
  doc.setFillColor(248, 249, 250) // Light grey card background
  doc.setDrawColor(220, 224, 230)
  doc.setLineWidth(0.2)
  doc.roundedRect(15, cardY, 180, cardHeight, 2, 2, "FD") // Fill and border

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(11, 27, 60)
  doc.text("STUDENT IDENTIFICATION RECORD", 20, cardY + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)
  doc.text(`Student Name:  ${data.studentName}`, 20, cardY + 11)
  doc.text(`Student ID:    ${data.studentId}`, 20, cardY + 16)
  doc.text(`Date Issued:    ${new Date().toLocaleDateString()}`, 20, cardY + 21)

  doc.text(`Degree Program: ${data.degree}`, 110, cardY + 11)
  doc.text(`Academic Level: ${data.level || "Undergraduate"}`, 110, cardY + 16)

  // 6. Layout: Table of Courses
  const tableStartY = cardY + cardHeight + 8
  autoTable(doc, {
    startY: tableStartY,
    head: [['Course Code', 'Course Name', 'Credits', 'Grade']],
    body: data.courses.map(c => [c.code, c.name, c.credits.toString(), c.grade]),
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [11, 27, 60], // Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 15, right: 15 },
  })

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || tableStartY + 40

  // 7. Layout: GPA & Signature
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(11, 27, 60)
  doc.text(`CUMULATIVE GPA:  ${data.gpa.toFixed(2)} / 4.00`, 15, finalY + 12)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(70, 70, 70)
  doc.text("University Registrar", 135, finalY + 28)
  
  doc.setDrawColor(197, 160, 89) // Gold line
  doc.setLineWidth(0.4)
  doc.line(130, finalY + 22, 180, finalY + 22)

  if (stampBase64) {
    doc.addImage(stampBase64, "PNG", 140, finalY + 2, 22, 22)
  }

  // 8. Layout: Footer Security Receipt Card (Receipt Box)
  // Anchored to the bottom of the page
  const footerY = 232
  doc.setFillColor(243, 244, 246) // Darker grey card for receipt
  doc.setDrawColor(197, 160, 89) // Gold border
  doc.setLineWidth(0.4)
  doc.roundedRect(15, footerY, 180, 48, 3, 3, "FD")

  // Title of Security Receipt Card
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(11, 27, 60)
  doc.text("CRYPTOGRAPHIC VERIFICATION RECEIPT (ON-CHAIN)", 20, footerY + 6)

  // Thin dividing line
  doc.setDrawColor(220, 224, 230)
  doc.setLineWidth(0.2)
  doc.line(20, footerY + 9, 190, footerY + 9)

  // QR Code inside receipt box
  doc.addImage(qrDataUrl, "PNG", 20, footerY + 11, 32, 32)

  // Metadata labels next to QR code
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(80, 80, 80)
  doc.text("PROTOCOL STATUS:", 58, footerY + 15)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(16, 185, 129) // Success Green
  doc.text("VERIFIED / ON-CHAIN SECURED", 90, footerY + 15)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text("Record ID:", 58, footerY + 21)
  doc.setFont("courier", "normal")
  doc.setTextColor(11, 27, 60)
  doc.text(data.recordId, 85, footerY + 21)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text("Registry Address:", 58, footerY + 26)
  doc.setFont("courier", "normal")
  doc.setTextColor(11, 27, 60)
  // Try to grab registryAddr if present in data, otherwise display default verifier URL segment
  const parsedRegistryAddr = data.verifierUrl.includes("registry=") 
    ? data.verifierUrl.split("registry=")[1].split("&")[0] 
    : "ON-CHAIN CONTRACT DEFAULT"
  doc.text(parsedRegistryAddr, 85, footerY + 26)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text("Verify URL:", 58, footerY + 31)
  doc.setFont("courier", "normal")
  doc.setTextColor(11, 27, 60)
  
  const splitUrl = doc.splitTextToSize(data.verifierUrl, 95)
  doc.text(splitUrl, 85, footerY + 31)

  doc.setFont("helvetica", "italic")
  doc.setFontSize(6.5)
  doc.setTextColor(120, 120, 120)
  doc.text("This receipt is cryptographically generated. Scanning the QR code verifies the integrity of this academic record on the ledger.", 58, footerY + 44)

  return doc.output("blob")
}

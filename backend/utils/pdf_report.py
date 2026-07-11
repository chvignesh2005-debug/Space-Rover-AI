from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet


def create_pdf(data):

    pdf = SimpleDocTemplate("Rover_Report.pdf")

    styles = getSampleStyleSheet()

    story = []

    story.append(Paragraph("<b>Space Rover Health Report</b>", styles["Title"]))

    story.append(Paragraph(f"Health Score : {data['overall_health_score']}", styles["Normal"]))

    story.append(Paragraph(f"Navigation Safe : {data['navigation_safe']}", styles["Normal"]))

    story.append(Paragraph(f"Summary : {data['summary']}", styles["Normal"]))

    pdf.build(story)

    return "Rover_Report.pdf"
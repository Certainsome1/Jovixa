from zipfile import ZipFile

import fitz

from app.services.resume_parser import ResumeParser


def test_parse_text_extracts_resume_profile_fields():
    parser = ResumeParser()

    parsed = parser.parse_text(
        """
        Senior PLM Engineer with 4.5 years of experience.
        Worked at Siemens Digital Industries Software.
        Previous role with Tata Technologies Ltd.
        Skills: Teamcenter, NX, BMIDE, CAD publishing, Python, PostgreSQL.
        """
    )

    assert parsed.experience_years == 4.5
    assert "teamcenter" in parsed.skills
    assert "nx" in parsed.skills
    assert "python" in parsed.skills
    assert "postgresql" in parsed.skills
    assert "Siemens Digital Industries Software" in parsed.companies
    assert "Tata Technologies Ltd" in parsed.companies


def test_experience_prefers_contextual_years():
    parser = ResumeParser()

    parsed = parser.parse_text(
        """
        Built 12 automation scripts for CAD support.
        Professional experience: 3 years in Teamcenter and NX administration.
        """
    )

    assert parsed.experience_years == 3.0


def test_parse_file_extracts_pdf_text(tmp_path):
    pdf_path = tmp_path / "resume.pdf"
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "Python engineer with 5 years experience at Bosch India.")
    document.save(pdf_path)
    document.close()

    parsed = ResumeParser().parse_file(pdf_path)

    assert "Python engineer" in parsed.text
    assert "python" in parsed.skills
    assert parsed.experience_years == 5.0


def test_parse_file_extracts_docx_text(tmp_path):
    docx_path = tmp_path / "resume.docx"
    document_xml = """
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r>
            <w:t>Teamcenter consultant with 6 years experience at Tata Technologies Ltd.</w:t>
          </w:r>
        </w:p>
      </w:body>
    </w:document>
    """.strip()

    with ZipFile(docx_path, "w") as archive:
        archive.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>')
        archive.writestr("word/document.xml", document_xml)

    parsed = ResumeParser().parse_file(docx_path)

    assert "Teamcenter consultant" in parsed.text
    assert "teamcenter" in parsed.skills
    assert parsed.experience_years == 6.0
    assert "Tata Technologies Ltd" in parsed.companies

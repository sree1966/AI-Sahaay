import os
import hashlib
from pathlib import Path
import pandas as pd

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


# ============================================================
# CONFIG
# ============================================================

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = Path(os.getenv("SCHEMES_CSV", str(BASE_DIR.parent / "data" / "schemes" / "updated_data.csv")))
CHROMA_PATH = Path(os.getenv("CHROMA_PATH", str(BASE_DIR.parent / "data" / "chroma_db"))).expanduser().resolve()
COLLECTION_NAME = "government_schemes"


# ============================================================
# HELPER
# ============================================================

def clean_value(value):
    """Convert CSV values into clean strings."""
    if pd.isna(value):
        return ""

    return str(value).strip()


# ============================================================
# LOAD DATASET
# ============================================================

def load_dataset():

    print("Loading government scheme dataset...")

    df = pd.read_csv(
        DATA_FILE,
        encoding="utf-8"
    )

    # Remove completely empty columns
    df = df.dropna(axis=1, how="all")

    print(f"Loaded {len(df)} schemes.")

    print("Dataset columns:")
    print(list(df.columns))

    return df


# ============================================================
# CREATE LANGCHAIN DOCUMENTS
# ============================================================

def create_documents(df):

    documents = []
    seen_schemes = set()

    for _, row in df.iterrows():

        scheme_name = clean_value(
            row.get("scheme_name", "")
        )

        # Skip invalid rows
        if not scheme_name:
            continue

        # The source CSV repeats a small number of schemes verbatim. Keep one
        # document per stable slug (or normalized name when no slug is present).
        identity = clean_value(row.get("slug", "")).casefold() or scheme_name.casefold()
        if identity in seen_schemes:
            continue
        seen_schemes.add(identity)

        slug = clean_value(
            row.get("slug", "")
        )

        details = clean_value(
            row.get("details", "")
        )

        benefits = clean_value(
            row.get("benefits", "")
        )

        eligibility = clean_value(
            row.get("eligibility", "")
        )

        application = clean_value(
            row.get("application", "")
        )

        documents_required = clean_value(
            row.get("documents", "")
        )

        level = clean_value(
            row.get("level", "")
        )

        category = clean_value(
            row.get("schemeCategory", "")
        )

        tags = clean_value(
            row.get("tags", "")
        )


        # ----------------------------------------------------
        # TEXT USED FOR SEMANTIC SEARCH
        # ----------------------------------------------------

        text = f"""
Scheme Name:
{scheme_name}

Level:
{level}

Category:
{category}

Tags:
{tags}

Details:
{details}

Benefits:
{benefits}

Eligibility:
{eligibility}

Application Process:
{application}

Documents Required:
{documents_required}
""".strip()


        # ----------------------------------------------------
        # DOCUMENT + METADATA
        # ----------------------------------------------------

        document = Document(

            page_content=text,

            metadata={

                "scheme_name": scheme_name,

                "slug": slug,

                "level": level,

                "category": category,

                "tags": tags,

                "details": details,

                "benefits": benefits,

                "eligibility": eligibility,

                "application": application,

                "documents": documents_required,
            }
        )

        documents.append(document)


    return documents


# ============================================================
# MAIN
# ============================================================

def main():

    # --------------------------------------------------------
    # 1. LOAD DATASET
    # --------------------------------------------------------

    df = load_dataset()


    # --------------------------------------------------------
    # 2. CREATE DOCUMENTS
    # --------------------------------------------------------

    documents = create_documents(df)

    print(
        f"Created {len(documents)} "
        f"LangChain documents."
    )


    # --------------------------------------------------------
    # 3. LOAD LOCAL EMBEDDING MODEL
    # --------------------------------------------------------

    print("Loading local embedding model...")

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    print("Local embedding model ready.")


    # --------------------------------------------------------
    # 4. CONNECT TO CHROMADB
    # --------------------------------------------------------

    print("Connecting to ChromaDB...")

    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH,
    )


    # Upsert stable IDs so rerunning ingestion updates records without
    # deleting the existing collection or creating duplicate schemes.

    print("Adding schemes to ChromaDB...")

    batch_size = 100

    total = len(documents)


    for start in range(0, total, batch_size):

        end = min(
            start + batch_size,
            total
        )

        batch = documents[start:end]

        # Give every document a stable ID
        ids = ["scheme_" + hashlib.sha256(
            (doc.metadata.get("slug") or doc.metadata["scheme_name"]).strip().casefold().encode("utf-8")
        ).hexdigest() for doc in batch]

        vector_store.add_documents(
            documents=batch,
            ids=ids
        )

        print(
            f"Indexed {end}/{total} schemes..."
        )


    # --------------------------------------------------------
    # 7. SUCCESS MESSAGE
    # --------------------------------------------------------

    print()

    print("======================================")
    print("AI SAHAAY RAG INGESTION COMPLETE!")
    print("======================================")

    print(
        f"Total schemes indexed: {total}"
    )

    print(
        f"ChromaDB: {CHROMA_PATH}"
    )

    print()
    print("Stored fields:")
    print("- Scheme name")
    print("- Details")
    print("- Benefits")
    print("- Eligibility")
    print("- Application process")
    print("- Required documents")
    print("- Category")
    print("- Level")
    print("- Tags")
    print("- Slug")

    print()
    print("AI Sahaay knowledge base is ready!")


# ============================================================
# RUN
# ============================================================


if __name__ == "__main__":
    main()

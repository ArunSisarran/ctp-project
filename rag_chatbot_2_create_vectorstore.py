import os
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from rag_chatbot_1_load_data import load_all_csv_documents

# Load environment variables from .env (for future use with GROQ)
load_dotenv()

# Define the persistent directory
current_dir = os.path.dirname(os.path.abspath(__file__))
db_dir = os.path.join(current_dir, "db")
persistent_directory = os.path.join(db_dir, "chroma_db_research")

print(f"Persistent directory: {persistent_directory}")

# Check if the Chroma vector store already exists
if not os.path.exists(persistent_directory):
    print("Persistent directory does not exist. Initializing vector store...")

    # Ensure the db directory exists
    os.makedirs(db_dir, exist_ok=True)

    # Load CSV data and create Document objects
    print("\nLoading CSV data and creating documents...")
    documents = load_all_csv_documents()

    if not documents:
        raise ValueError("No documents were loaded. Please check your CSV files.")

    # For CSV rows, each row is already a small, self-contained chunk
    # So we don't need to split them further
    # Each document is already appropriately sized for embedding
    docs = documents

    # Display information about the documents
    print("\n--- Document Chunks Information ---")
    print(f"Number of document chunks: {len(docs)}")

    # Create embeddings using HuggingFace (free, no API key needed)
    # Using a lightweight, fast embedding model
    print("\n--- Creating embeddings ---")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    print("--- Finished creating embeddings ---")

    # Create the vector store and persist it
    print("\n--- Creating and persisting vector store ---")
    db = Chroma.from_documents(
        docs, embeddings, persist_directory=persistent_directory
    )
    print("--- Finished creating and persisting vector store ---")
    print(f"\n✓ Vector store saved to {persistent_directory}")

else:
    print("Vector store already exists. No need to initialize.")
    print(f"To rebuild the vector store, delete the directory: {persistent_directory}")


import pymongo
from pymongo import MongoClient
from pymongo.errors import ConnectionError, OperationFailure, NetworkTimeout, ConfigurationError, DuplicateKeyError
import logging

# Database connection configurations
DATABASE_URI = "mongodb+srv://kumarvinayak829:qJGqZkVDPcRAYhHs@vehicledata.gskjh.mongodb.net/?retryWrites=true&w=majority&appName=VehicleData"
DATABASE_NAME = "fleet_management"

# Initialize the logger with timestamp formatting
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create a connection pool
client = None
db = None

def get_client():
    """
    Return a MongoDB client instance with connection pooling.
    """
    global client
    if client is None:
        try:
            # Adjust maxPoolSize based on expected traffic and workload
            client = MongoClient(DATABASE_URI, maxPoolSize=20, waitQueueTimeoutMS=5000)
            logger.info(f"Connected to MongoDB at {DATABASE_URI}")
        except (ConnectionError, NetworkTimeout, ConfigurationError) as e:
            logger.error(f"Connection error: {e}")
            raise e
    return client

def get_db():
    """
    Get the database instance. Lazy loading: database will only be initialized when needed.
    """
    global db
    if db is None:
        client = get_client()
        db = client[DATABASE_NAME]
        logger.info(f"Connected to database: {DATABASE_NAME}")
    return db

def get_collection(collection_name):
    """
    Get a specific collection from the database.
    """
    try:
        database = get_db()
        collection = database[collection_name]
        logger.debug(f"Accessing collection: {collection_name}")
        return collection
    except Exception as e:
        logger.error(f"Error accessing collection {collection_name}: {e}")
        raise e

def insert_document(collection_name, document):
    """
    Insert a document into a MongoDB collection.
    """
    try:
        collection = get_collection(collection_name)
        result = collection.insert_one(document)
        logger.info(f"Document inserted with ID: {result.inserted_id}")
        return result.inserted_id
    except DuplicateKeyError as e:
        logger.error(f"Duplicate key error while inserting into {collection_name}: {e}")
        raise e
    except Exception as e:
        logger.error(f"Failed to insert document into {collection_name}: {e}")
        raise e

def insert_documents(collection_name, documents):
    """
    Insert multiple documents into a MongoDB collection in a single operation.
    """
    try:
        collection = get_collection(collection_name)
        result = collection.insert_many(documents)
        logger.info(f"Inserted {len(result.inserted_ids)} documents into {collection_name}")
        return result.inserted_ids
    except DuplicateKeyError as e:
        logger.error(f"Duplicate key error while inserting multiple documents into {collection_name}: {e}")
        raise e
    except Exception as e:
        logger.error(f"Failed to insert multiple documents into {collection_name}: {e}")
        raise e

def update_document(collection_name, query, update_data):
    """
    Update a document in a MongoDB collection.
    """
    try:
        collection = get_collection(collection_name)
        result = collection.update_one(query, {"$set": update_data})
        logger.info(f"Documents matched: {result.matched_count}, Documents modified: {result.modified_count}")
        return result.modified_count
    except OperationFailure as e:
        logger.error(f"Operation failure while updating document in {collection_name}: {e}")
        raise e
    except Exception as e:
        logger.error(f"Failed to update document in {collection_name}: {e}")
        raise e

def find_documents(collection_name, query=None, projection=None):
    """
    Find documents in a MongoDB collection.
    """
    try:
        collection = get_collection(collection_name)
        if query is None:
            query = {}
        documents = list(collection.find(query, projection))
        logger.debug(f"Found {len(documents)} document(s) in {collection_name}")
        return documents
    except Exception as e:
        logger.error(f"Failed to fetch documents from {collection_name}: {e}")
        raise e

def delete_document(collection_name, query):
    """
    Delete a document from a MongoDB collection.
    """
    try:
        collection = get_collection(collection_name)
        result = collection.delete_one(query)
        logger.info(f"Documents deleted: {result.deleted_count}")
        return result.deleted_count
    except Exception as e:
        logger.error(f"Failed to delete document from {collection_name}: {e}")
        raise e

def delete_documents(collection_name, query):
    """
    Delete multiple documents from a MongoDB collection.
    """
    try:
        collection = get_collection(collection_name)
        result = collection.delete_many(query)
        logger.info(f"Documents deleted: {result.deleted_count}")
        return result.deleted_count
    except Exception as e:
        logger.error(f"Failed to delete multiple documents from {collection_name}: {e}")
        raise e

def close_connection():
    """
    Close the database connection gracefully.
    """
    global client
    if client:
        try:
            client.close()
            logger.info("Database connection closed.")
        except Exception as e:
            logger.error(f"Failed to close database connection: {e}")
            raise e
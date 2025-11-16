import os
import pandas as pd
from datetime import datetime
from pyalex import Works, config
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set email from environment variable
config.email = os.getenv('OPENALEX_EMAIL')

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)


def get_top_subfields_in_domain_by_us_works(domain_id: int = 3, top_n: int = 10):
    """Get top subfields in a domain based on US works count."""
    try:
        grouped_results = Works().filter(
            **{
                'topics.domain.id': domain_id,
                'authorships.institutions.country_code': 'US'
            }
        ).group_by('topics.subfield.id').get()
        
        subfields_list = []
        for group in grouped_results:
            if group.get('key') and group.get('key_display_name'):
                subfields_list.append({
                    'id': group['key'].split('/')[-1], 
                    'name': group['key_display_name'],
                    'us_works_count': group['count']
                })
        
        subfields_list.sort(key=lambda x: x['us_works_count'], reverse=True)
        return subfields_list[:top_n]
    
    except Exception as e:
        print(f"Error in get_top_subfields_in_domain_by_us_works: {e}")
        return []


def get_top_topics_for_subfields(domain_id: int = 3, top_n_subfields: int = 10, top_n_topics: int = 20):
    """
    Get top N topics for each of the top M subfields in a domain.
    Returns a dictionary with subfield IDs as keys and lists of topics as values.
    """
    try:
        # First get the top subfields
        print("Fetching top US subfields...")
        top_subfields = get_top_subfields_in_domain_by_us_works(domain_id, top_n_subfields)
        
        if not top_subfields:
            print("No subfields found!")
            return {}
        
        print(f"Found {len(top_subfields)} top subfields")
        subfield_topics = {}
        
        for i, subfield in enumerate(top_subfields, 1):
            subfield_id = subfield['id']
            subfield_name = subfield['name']
            
            print(f"[{i}/{len(top_subfields)}] Fetching top {top_n_topics} topics for subfield: {subfield_name}")
            
            # Get topics specifically for this subfield
            grouped_results = Works().filter(
                **{
                    'topics.domain.id': domain_id,
                    'topics.subfield.id': subfield_id,
                    'authorships.institutions.country_code': 'US'
                }
            ).group_by('topics.id').get()
            
            topics_list = []
            for group in grouped_results:
                if group.get('key') and group.get('key_display_name'):
                    # Extract field and subfield info from the group data
                    topic_info = group.get('primary_topic', {})
                    field_name = topic_info.get('field', {}).get('display_name', 'Unknown')
                    subfield_name_from_topic = topic_info.get('subfield', {}).get('display_name', 'Unknown')
                    
                    topics_list.append({
                        'id': group['key'].split('/')[-1],
                        'name': group['key_display_name'],
                        'field': field_name,
                        'subfield': subfield_name_from_topic,
                        'us_works_count': group['count']
                    })
            
            topics_list.sort(key=lambda x: x['us_works_count'], reverse=True)
            subfield_topics[subfield_id] = topics_list[:top_n_topics]
            print(f"  ✓ Found {len(topics_list)} topics, keeping top {len(topics_list[:top_n_topics])}")
        
        return subfield_topics
    
    except Exception as e:
        print(f"Error in get_top_topics_for_subfields: {e}")
        return {}


def main():
    domain_id = 3  # Physical Sciences
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print("=" * 80)
    print(f"FETCHING SUBFIELD-SPECIFIC TOPICS - Domain {domain_id}: Physical Sciences")
    print(f"Using email: annie16950@gmail.com")
    print(f"Timestamp: {timestamp}")
    print("=" * 80)
    print()
    
    # Get top 20 topics for each of the top 10 subfields
    subfield_topics_data = get_top_topics_for_subfields(domain_id, top_n_subfields=10, top_n_topics=20)
    
    if subfield_topics_data:
        print(f"\nSuccessfully fetched topics for {len(subfield_topics_data)} subfields")
        
        # Save each subfield's topics to separate CSV files
        for subfield_id, topics_list in subfield_topics_data.items():
            if topics_list:
                df_topics = pd.DataFrame(topics_list)
                df_topics['fetch_date'] = timestamp
                csv_path = os.path.join(DATA_DIR, f'topics_subfield_{subfield_id}.csv')
                df_topics.to_csv(csv_path, index=False)
                print(f"✓ Saved {len(topics_list)} topics for subfield {subfield_id} to {csv_path}")
        
        # Also create a combined file with all subfield topics
        all_topics = []
        for subfield_id, topics_list in subfield_topics_data.items():
            for topic in topics_list:
                topic['subfield_id'] = subfield_id
                all_topics.append(topic)
        
        if all_topics:
            df_all_topics = pd.DataFrame(all_topics)
            df_all_topics['fetch_date'] = timestamp
            csv_path = os.path.join(DATA_DIR, 'subfield_topics_us.csv')
            df_all_topics.to_csv(csv_path, index=False)
            print(f"✓ Saved {len(all_topics)} total topics across all subfields to {csv_path}")
        
        print()
        print("=" * 80)
        print("SUBFIELD TOPICS FETCH COMPLETE!")
        print("=" * 80)
        print(f"\nAll CSV files saved to '{DATA_DIR}/' directory")
        print(f"Last updated: {timestamp}")
        
        # Show summary
        print(f"\nSummary:")
        print(f"- Total subfields processed: {len(subfield_topics_data)}")
        print(f"- Total topics fetched: {len(all_topics)}")
        print(f"- Average topics per subfield: {len(all_topics) / len(subfield_topics_data):.1f}")
        
    else:
        print("No subfield topics data was fetched successfully.")


if __name__ == "__main__":
    main()

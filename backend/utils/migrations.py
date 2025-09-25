"""
Simple database migration system
Addresses the missing migration infrastructure issue
"""

import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any
from utils.database import get_db_connection
from utils.logger import get_logger

logger = get_logger(__name__)

class Migration:
    """Base migration class"""
    
    def __init__(self, version: str, description: str):
        self.version = version
        self.description = description
        self.timestamp = datetime.utcnow()
    
    def up(self, cursor: sqlite3.Cursor) -> None:
        """Apply migration"""
        raise NotImplementedError("Subclasses must implement up() method")
    
    def down(self, cursor: sqlite3.Cursor) -> None:
        """Rollback migration"""
        raise NotImplementedError("Subclasses must implement down() method")

class CreateMigrationsTable(Migration):
    """Initial migration to create migrations tracking table"""
    
    def __init__(self):
        super().__init__("001", "Create migrations tracking table")
    
    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS migrations (
                version TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    def down(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('DROP TABLE IF EXISTS migrations')

class CreateAccidentsTable(Migration):
    """Create enhanced accidents table with all fields"""
    
    def __init__(self):
        super().__init__("002", "Create enhanced accidents table")
    
    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                company TEXT,
                vehicle_make TEXT,
                vehicle_model TEXT,
                location_address TEXT,
                location_lat REAL,
                location_lng REAL,
                city TEXT,
                county TEXT,
                city_type TEXT,
                intersection_type TEXT,
                damage_severity TEXT,
                weather_conditions TEXT,
                time_of_day TEXT,
                casualties INTEGER DEFAULT 0,
                av_mode TEXT,
                speed_limit INTEGER,
                traffic_signals TEXT,
                road_type TEXT,
                damage_location TEXT,
                raw_text TEXT,
                report_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_company ON accidents(company)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_city ON accidents(city)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_timestamp ON accidents(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_coordinates ON accidents(location_lat, location_lng)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_severity ON accidents(damage_severity)')
    
    def down(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('DROP TABLE IF EXISTS accidents')

class AddGeospatialIndexes(Migration):
    """Add geospatial indexes for better map performance"""
    
    def __init__(self):
        super().__init__("003", "Add geospatial indexes")
    
    def up(self, cursor: sqlite3.Cursor) -> None:
        # Create compound index for geospatial queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_geo_bounds ON accidents(location_lat, location_lng, city_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_company_geo ON accidents(company, location_lat, location_lng)')
    
    def down(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('DROP INDEX IF EXISTS idx_accidents_geo_bounds')
        cursor.execute('DROP INDEX IF EXISTS idx_accidents_company_geo')

class CreateDmvReportsTable(Migration):
    """Create table to store DMV index entries (reports)"""
    def __init__(self):
        super().__init__("004", "Create DMV reports and indexes")

    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dmv_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                manufacturer TEXT,
                incident_date DATE,
                year INTEGER,
                display_text TEXT,
                page_url TEXT,
                pdf_url TEXT,
                source_slug TEXT,
                sequence_num INTEGER DEFAULT 1,
                pdf_sha256 TEXT,
                status TEXT DEFAULT 'new',
                error_msg TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_dmv_reports_date ON dmv_reports(incident_date)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS uq_dmv_reports_unique ON dmv_reports(manufacturer, incident_date, sequence_num)')

    def down(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('DROP TABLE IF EXISTS dmv_reports')

class CreateDmvScrapeRunsTable(Migration):
    """Create table to track scraper runs"""
    def __init__(self):
        super().__init__("005", "Create DMV scrape runs table")

    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dmv_scrape_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                finished_at DATETIME,
                status TEXT,
                found INTEGER DEFAULT 0,
                new INTEGER DEFAULT 0,
                downloaded INTEGER DEFAULT 0,
                parsed INTEGER DEFAULT 0,
                errors INTEGER DEFAULT 0,
                notes TEXT
            )
        ''')

    def down(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('DROP TABLE IF EXISTS dmv_scrape_runs')

class AddAccidentsSourceColumns(Migration):
    """Add source columns to accidents for DMV linkage"""
    def __init__(self):
        super().__init__("006", "Add source columns to accidents")

    def up(self, cursor: sqlite3.Cursor) -> None:
        # Add columns if they don't exist
        cursor.execute('PRAGMA table_info(accidents)')
        cols = {row[1] for row in cursor.fetchall()}
        if 'source' not in cols:
            cursor.execute("ALTER TABLE accidents ADD COLUMN source TEXT DEFAULT 'dmv_pdf'")
        if 'source_report_id' not in cols:
            cursor.execute('ALTER TABLE accidents ADD COLUMN source_report_id INTEGER')
        if 'pdf_url' not in cols:
            cursor.execute('ALTER TABLE accidents ADD COLUMN pdf_url TEXT')
        if 'pdf_local_path' not in cols:
            cursor.execute('ALTER TABLE accidents ADD COLUMN pdf_local_path TEXT')
        # Optional index for source_report_id
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accidents_source_report ON accidents(source_report_id)')

    def down(self, cursor: sqlite3.Cursor) -> None:
        # SQLite cannot drop columns easily; keep as no-op or recreate table in a real migration system
        pass

class CreateDmvPdfFilesTable(Migration):
    """Table storing downloaded PDF metadata"""
    def __init__(self):
        super().__init__("007", "Create DMV PDF files table")

    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dmv_pdf_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                local_path TEXT,
                size_bytes INTEGER,
                pages INTEGER,
                sha256 TEXT,
                downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sha256),
                FOREIGN KEY(report_id) REFERENCES dmv_reports(id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_dmv_pdf_report ON dmv_pdf_files(report_id)')

    def down(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('DROP TABLE IF EXISTS dmv_pdf_files')

class AddDamageDiagramColumns(Migration):
    """Add columns for damage diagram path and quadrant scores"""
    def __init__(self):
        super().__init__("008", "Add damage diagram columns to accidents")

    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('PRAGMA table_info(accidents)')
        cols = {row[1] for row in cursor.fetchall()}
        if 'damage_diagram_path' not in cols:
            cursor.execute('ALTER TABLE accidents ADD COLUMN damage_diagram_path TEXT')
        if 'damage_quadrants' not in cols:
            cursor.execute('ALTER TABLE accidents ADD COLUMN damage_quadrants TEXT')

    def down(self, cursor: sqlite3.Cursor) -> None:
        # SQLite cannot drop columns easily; leave as no-op
        pass

class AddFormSectionsColumn(Migration):
    """Add JSON column to store parsed form sections (1-6)"""
    def __init__(self):
        super().__init__("009", "Add form_sections column to accidents")

    def up(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute('PRAGMA table_info(accidents)')
        cols = {row[1] for row in cursor.fetchall()}
        if 'form_sections' not in cols:
            cursor.execute('ALTER TABLE accidents ADD COLUMN form_sections TEXT')

    def down(self, cursor: sqlite3.Cursor) -> None:
        # SQLite cannot drop columns easily; leave as no-op
        pass

class MigrationManager:
    """Manages database migrations"""
    
    def __init__(self):
        self.migrations: List[Migration] = [
            CreateMigrationsTable(),
            CreateAccidentsTable(),
            AddGeospatialIndexes(),
            CreateDmvReportsTable(),
            CreateDmvScrapeRunsTable(),
            AddAccidentsSourceColumns(),
            CreateDmvPdfFilesTable(),
            AddDamageDiagramColumns(),
            AddFormSectionsColumn()
        ]
    
    def get_applied_migrations(self) -> List[str]:
        """Get list of applied migration versions"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT version FROM migrations ORDER BY version')
                return [row[0] for row in cursor.fetchall()]
        except sqlite3.OperationalError:
            # Migrations table doesn't exist yet
            return []
    
    def apply_migration(self, migration: Migration) -> None:
        """Apply a single migration"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Apply the migration
                migration.up(cursor)
                
                # Record the migration
                cursor.execute(
                    'INSERT OR REPLACE INTO migrations (version, description) VALUES (?, ?)',
                    (migration.version, migration.description)
                )
                
                conn.commit()
                logger.info(f"Applied migration {migration.version}: {migration.description}")
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to apply migration {migration.version}: {e}")
                raise
    
    def rollback_migration(self, migration: Migration) -> None:
        """Rollback a single migration"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Rollback the migration
                migration.down(cursor)
                
                # Remove the migration record
                cursor.execute('DELETE FROM migrations WHERE version = ?', (migration.version,))
                
                conn.commit()
                logger.info(f"Rolled back migration {migration.version}: {migration.description}")
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to rollback migration {migration.version}: {e}")
                raise
    
    def migrate(self) -> None:
        """Apply all pending migrations"""
        applied_versions = self.get_applied_migrations()
        
        pending_migrations = [
            m for m in self.migrations 
            if m.version not in applied_versions
        ]
        
        if not pending_migrations:
            logger.info("No pending migrations")
            return
        
        logger.info(f"Applying {len(pending_migrations)} pending migrations")
        
        for migration in pending_migrations:
            self.apply_migration(migration)
        
        logger.info("All migrations applied successfully")
    
    def rollback_to(self, target_version: str) -> None:
        """Rollback to a specific migration version"""
        applied_versions = self.get_applied_migrations()
        
        # Find migrations to rollback (in reverse order)
        migrations_to_rollback = []
        for migration in reversed(self.migrations):
            if migration.version in applied_versions:
                migrations_to_rollback.append(migration)
                if migration.version == target_version:
                    break
        
        logger.info(f"Rolling back {len(migrations_to_rollback)} migrations to version {target_version}")
        
        for migration in migrations_to_rollback:
            self.rollback_migration(migration)
        
        logger.info(f"Rollback to version {target_version} completed")
    
    def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status"""
        applied_versions = self.get_applied_migrations()
        
        status = {
            'total_migrations': len(self.migrations),
            'applied_migrations': len(applied_versions),
            'pending_migrations': len(self.migrations) - len(applied_versions),
            'migrations': []
        }
        
        for migration in self.migrations:
            status['migrations'].append({
                'version': migration.version,
                'description': migration.description,
                'applied': migration.version in applied_versions
            })
        
        return status

# Global migration manager instance
migration_manager = MigrationManager()

def run_migrations():
    """Run all pending migrations"""
    migration_manager.migrate()

def get_migration_status():
    """Get migration status"""
    return migration_manager.get_migration_status()

if __name__ == "__main__":
    # Run migrations when script is executed directly
    run_migrations()

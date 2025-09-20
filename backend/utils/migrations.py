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

class MigrationManager:
    """Manages database migrations"""
    
    def __init__(self):
        self.migrations: List[Migration] = [
            CreateMigrationsTable(),
            CreateAccidentsTable(),
            AddGeospatialIndexes()
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

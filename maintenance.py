"""
📋 MANTENIMIENTO DE TABLAS - Backend
Gestión de CRUD completo para todas las tablas de la base de datos
Compatible con Supabase y modo local (st.session_state)
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import streamlit as st
import json
import uuid

# ============================================================================
# CLASE MANAGER DE TABLAS
# ============================================================================

class TableManager:
    """
    Gestor centralizado para todas las operaciones CRUD de la base de datos.
    Proporciona métodos para crear, leer, actualizar y eliminar registros
    en cualquier tabla. Compatible con Supabase y modo local.
    """

    def __init__(self, supabase_client=None):
        self.db = supabase_client
        self.use_local = supabase_client is None
        
        # Inicializar tablas locales si es necesario
        if self.use_local:
            local_tables = [
                'users', 'teams', 'matches', 'user_predictions', 
                'ai_predictions', 'competitions', 'competition_participants',
                'bets', 'alerts'
            ]
            for table in local_tables:
                if f'local_{table}' not in st.session_state:
                    st.session_state[f'local_{table}'] = []

    def _get_local_table(self, table_name: str) -> List[Dict]:
        """Obtiene una tabla del almacenamiento local"""
        return st.session_state.get(f'local_{table_name}', [])

    def _save_local_table(self, table_name: str, data: List[Dict]):
        """Guarda una tabla en el almacenamiento local"""
        st.session_state[f'local_{table_name}'] = data

    # ========== USUARIOS ==========

    def create_user(self, email: str, username: str, password: str = None, full_name: str = None, subscription_tier: str = 'free') -> bool:
        """Crea un nuevo usuario"""
        try:
            user_id = str(uuid.uuid4())
            data = {
                'id': user_id,
                'email': email,
                'username': username,
                'password': password,
                'full_name': full_name,
                'subscription_tier': subscription_tier,
                'created_at': datetime.now().isoformat()
            }
            
            if self.use_local:
                users = self._get_local_table('users')
                users.append(data)
                self._save_local_table('users', users)
            else:
                self.db.table('users').insert(data).execute()
            
            return True
        except Exception as e:
            st.error(f"Error creando usuario: {e}")
            return False

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Obtiene información del usuario"""
        try:
            if self.use_local:
                users = self._get_local_table('users')
                for user in users:
                    if user.get('id') == user_id:
                        return user
                return None
            else:
                response = self.db.table('users').select('*').eq('id', user_id).execute()
                return response.data[0] if response.data else None
        except Exception as e:
            st.error(f"Error obteniendo usuario: {e}")
            return None

    def update_user(self, user_id: str, updates: Dict) -> bool:
        """Actualiza datos del usuario"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            if self.use_local:
                users = self._get_local_table('users')
                for i, user in enumerate(users):
                    if user.get('id') == user_id:
                        users[i].update(updates)
                        self._save_local_table('users', users)
                        break
            else:
                self.db.table('users').update(updates).eq('id', user_id).execute()
            
            return True
        except Exception as e:
            st.error(f"Error actualizando usuario: {e}")
            return False

    def delete_user(self, user_id: str) -> bool:
        """Elimina un usuario"""
        try:
            if self.use_local:
                users = self._get_local_table('users')
                users = [u for u in users if u.get('id') != user_id]
                self._save_local_table('users', users)
            else:
                self.db.table('users').delete().eq('id', user_id).execute()
            
            return True
        except Exception as e:
            st.error(f"Error eliminando usuario: {e}")
            return False

    def get_all_users(self) -> List[Dict]:
        """Obtiene todos los usuarios"""
        try:
            if self.use_local:
                return self._get_local_table('users')
            else:
                response = self.db.table('users').select('*').execute()
                return response.data if response.data else []
        except Exception as e:
            st.error(f"Error obteniendo usuarios: {e}")
            return []

    # ========== EQUIPOS ==========

    def create_team(self, name: str, country: str = None, sport_type: str = 'football') -> bool:
        """Crea un nuevo equipo"""
        try:
            team_id = str(uuid.uuid4())
            data = {
                'id': team_id,
                'name': name,
                'country': country,
                'sport_type': sport_type,
                'created_at': datetime.now().isoformat()
            }
            
            if self.use_local:
                teams = self._get_local_table('teams')
                teams.append(data)
                self._save_local_table('teams', teams)
            else:
                self.db.table('teams').insert(data).execute()
            
            return True
        except Exception as e:
            st.error(f"Error creando equipo: {e}")
            return False

    def get_team(self, team_id: str) -> Optional[Dict]:
        """Obtiene información del equipo"""
        try:
            if self.use_local:
                teams = self._get_local_table('teams')
                for team in teams:
                    if team.get('id') == team_id:
                        return team
                return None
            else:
                response = self.db.table('teams').select('*').eq('id', team_id).execute()
                return response.data[0] if response.data else None
        except Exception as e:
            st.error(f"Error obteniendo equipo: {e}")
            return None

    def get_teams_by_sport(self, sport_type: str) -> List[Dict]:
        """Obtiene equipos por deporte"""
        try:
            if self.use_local:
                teams = self._get_local_table('teams')
                return [t for t in teams if t.get('sport_type') == sport_type]
            else:
                response = self.db.table('teams').select('*').eq('sport_type', sport_type).execute()
                return response.data if response.data else []
        except Exception as e:
            st.error(f"Error obteniendo equipos: {e}")
            return []

    def update_team(self, team_id: str, updates: Dict) -> bool:
        """Actualiza datos del equipo"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            if self.use_local:
                teams = self._get_local_table('teams')
                for i, team in enumerate(teams):
                    if team.get('id') == team_id:
                        teams[i].update(updates)
                        self._save_local_table('teams', teams)
                        break
            else:
                self.db.table('teams').update(updates).eq('id', team_id).execute()
            
            return True
        except Exception as e:
            st.error(f"Error actualizando equipo: {e}")
            return False

    def get_all_teams(self) -> List[Dict]:
        """Obtiene todos los equipos"""
        try:
            if self.use_local:
                return self._get_local_table('teams')
            else:
                response = self.db.table('teams').select('*').execute()
                return response.data if response.data else []
        except Exception as e:
            st.error(f"Error obteniendo equipos: {e}")
            return []

    # ========== PARTIDOS ==========

    def create_match(self, home_team_id: str = None, away_team_id: str = None, match_date: datetime = None,
                     league: str = None, sport_type: str = 'football', 
                     home_team_name: str = None, away_team_name: str = None) -> bool:
        """Crea un nuevo partido"""
        try:
            match_id = str(uuid.uuid4())
            data = {
                'id': match_id,
                'home_team_name': home_team_name,
                'away_team_name': away_team_name,
                'match_date': match_date.isoformat() if match_date else datetime.now().isoformat(),
                'league': league,
                'sport_type': sport_type,
                'status': 'scheduled',
                'created_at': datetime.now().isoformat()
            }
            
            # Añadir IDs de equipo solo si están presentes
            if home_team_id:
                data['home_team_id'] = home_team_id
            if away_team_id:
                data['away_team_id'] = away_team_id
            
            if self.use_local:
                matches = self._get_local_table('matches')
                matches.append(data)
                self._save_local_table('matches', matches)
            else:
                self.db.table('matches').insert(data).execute()
            
            return True
        except Exception as e:
            st.error(f"Error creando partido: {e}")
            return False

    def get_match(self, match_id: str) -> Optional[Dict]:
        """Obtiene información del partido"""
        try:
            if self.use_local:
                matches = self._get_local_table('matches')
                for match in matches:
                    if match.get('id') == match_id:
                        return match
                return None
            else:
                response = self.db.table('matches').select('*').eq('id', match_id).execute()
                return response.data[0] if response.data else None
        except Exception as e:
            st.error(f"Error obteniendo partido: {e}")
            return None

    def update_match(self, match_id: str, updates: Dict) -> bool:
        """Actualiza datos del partido"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            if self.use_local:
                matches = self._get_local_table('matches')
                for i, match in enumerate(matches):
                    if match.get('id') == match_id:
                        matches[i].update(updates)
                        self._save_local_table('matches', matches)
                        break
            else:
                self.db.table('matches').update(updates).eq('id', match_id).execute()
            
            return True
        except Exception as e:
            st.error(f"Error actualizando partido: {e}")
            return False

    def get_upcoming_matches(self, days: int = 7) -> List[Dict]:
        """Obtiene partidos próximos"""
        try:
            from_date = datetime.now().isoformat()
            to_date = (datetime.now() + timedelta(days=days)).isoformat()
            
            if self.use_local:
                matches = self._get_local_table('matches')
                return [m for m in matches if from_date <= m.get('match_date', '') <= to_date]
            else:
                response = self.db.table('matches').select('*').gte('match_date', from_date).lte('match_date', to_date).execute()
                return response.data if response.data else []
        except Exception as e:
            st.error(f"Error obteniendo partidos: {e}")
            return []

    def get_finished_matches(self) -> List[Dict]:
        """Obtiene partidos finalizados"""
        try:
            if self.use_local:
                matches = self._get_local_table('matches')
                return [m for m in matches if m.get('status') == 'finished']
            else:
                response = self.db.table('matches').select('*').eq('status', 'finished').execute()
                return response.data if response.data else []
        except Exception as e:
            st.error(f"Error obteniendo partidos finalizados: {e}")
            return []

    # ========== MÉTODOS GENERALES ==========

    def get_table_data(self, table_name: str, limit: int = 1000) -> List[Dict]:
        """Obtiene todos los datos de una tabla"""
        try:
            if self.use_local:
                return self._get_local_table(table_name)[:limit]
            else:
                response = self.db.table(table_name).select('*').limit(limit).execute()
                return response.data if response.data else []
        except Exception as e:
            st.error(f"Error obteniendo datos de {table_name}: {e}")
            return []

    def get_table_count(self, table_name: str) -> int:
        """Obtiene la cantidad de registros en una tabla"""
        try:
            if self.use_local:
                return len(self._get_local_table(table_name))
            else:
                response = self.db.table(table_name).select('id', count='exact').execute()
                return len(response.data) if response.data else 0
        except Exception as e:
            st.error(f"Error contando registros: {e}")
            return 0

    def export_table_to_dataframe(self, table_name: str) -> pd.DataFrame:
        """Exporta tabla a DataFrame"""
        try:
            data = self.get_table_data(table_name)
            return pd.DataFrame(data) if data else pd.DataFrame()
        except Exception as e:
            st.error(f"Error exportando tabla: {e}")
            return pd.DataFrame()

    def get_database_stats(self) -> Dict:
        """Obtiene estadísticas generales de la BD"""
        try:
            stats = {
                'total_users': self.get_table_count('users'),
                'total_teams': self.get_table_count('teams'),
                'total_matches': self.get_table_count('matches'),
                'total_predictions': self.get_table_count('user_predictions'),
                'total_competitions': self.get_table_count('competitions'),
                'total_bets': self.get_table_count('bets'),
                'total_alerts': self.get_table_count('alerts'),
            }
            return stats
        except Exception as e:
            st.error(f"Error obteniendo estadísticas: {e}")
            return {}


# ============================================================================
# INTERFAZ DE ADMINISTRACIÓN
# ============================================================================

def show_table_manager_ui(supabase_client=None):
    """Interfaz Streamlit para el gestor de tablas"""

    manager = TableManager(supabase_client)
    
    # Indicar modo de operación
    if manager.use_local:
        st.info("💾 Modo: Almacenamiento local (sin Supabase)")
    else:
        st.success("☁️ Modo: Conexión a Supabase")

    st.title("📋 Administración de Base de Datos")

    tab1, tab2, tab3, tab4 = st.tabs(
        ["📊 Estadísticas", "👥 Usuarios", "⚽ Equipos", "🎯 Partidos"]
    )

    # TAB 1: ESTADÍSTICAS
    with tab1:
        st.subheader("Estadísticas de Base de Datos")

        stats = manager.get_database_stats()

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Usuarios", stats.get('total_users', 0))
        with col2:
            st.metric("Total Equipos", stats.get('total_teams', 0))
        with col3:
            st.metric("Total Partidos", stats.get('total_matches', 0))
        with col4:
            st.metric("Total Predicciones", stats.get('total_predictions', 0))

        col5, col6, col7 = st.columns(3)
        with col5:
            st.metric("Competencias", stats.get('total_competitions', 0))
        with col6:
            st.metric("Apuestas", stats.get('total_bets', 0))
        with col7:
            st.metric("Alertas", stats.get('total_alerts', 0))

    # TAB 2: USUARIOS
    with tab2:
        st.subheader("Gestión de Usuarios")

        subcol1, subcol2 = st.columns(2)

        with subcol1:
            st.write("**Crear Nuevo Usuario**")
            email = st.text_input("Email", key="admin_email")
            username = st.text_input("Username", key="admin_username")
            password = st.text_input("Contraseña", type="password", key="admin_password")
            full_name = st.text_input("Nombre Completo", key="admin_fullname")
            subscription_tier = st.selectbox("Plan", ["free", "pro", "elite"], key="admin_subscription_tier")

            if st.button("Crear Usuario", key="btn_create_user"):
                if manager.create_user(email, username, password, full_name, subscription_tier):
                    st.success("✅ Usuario creado correctamente")
                    st.rerun()
                else:
                    st.error("❌ Error creando usuario")

        with subcol2:
            st.write("**Listar Usuarios**")
            users = manager.get_all_users()
            if users:
                df_users = pd.DataFrame(users)
                st.dataframe(df_users)
            else:
                st.info("No hay usuarios en la base de datos")

    # TAB 3: EQUIPOS
    with tab3:
        st.subheader("Gestión de Equipos")

        subcol1, subcol2 = st.columns(2)

        with subcol1:
            st.write("**Crear Nuevo Equipo**")
            team_name = st.text_input("Nombre del Equipo", key="admin_team_name")
            team_country = st.text_input("País", key="admin_team_country")
            team_sport = st.selectbox("Deporte", ["football", "basketball", "tennis", "baseball"], key="admin_team_sport")

            if st.button("Crear Equipo", key="btn_create_team"):
                if manager.create_team(team_name, team_country, team_sport):
                    st.success("✅ Equipo creado correctamente")
                    st.rerun()
                else:
                    st.error("❌ Error creando equipo")

        with subcol2:
            st.write("**Listar Equipos**")
            teams = manager.get_all_teams()
            if teams:
                df_teams = pd.DataFrame(teams)
                st.dataframe(df_teams)
            else:
                st.info("No hay equipos en la base de datos")

    # TAB 4: PARTIDOS
    with tab4:
        st.subheader("Gestión de Partidos")
        
        # Obtener equipos disponibles para seleccionar
        teams = manager.get_all_teams()
        team_options = [(team['id'], team['name']) for team in teams] if teams else []
        team_names = [team[1] for team in team_options]
        team_map = {team[1]: team[0] for team in team_options}  # Mapa nombre -> ID
        
        # Formulario para crear partido
        st.write("**Crear Nuevo Partido**")
        col1, col2 = st.columns(2)
        
        with col1:
            home_team_name = st.selectbox("Equipo Local", options=team_names, key="admin_home_team") if team_names else st.text_input("Equipo Local", key="admin_home_team_text")
            away_team_name = st.selectbox("Equipo Visitante", options=team_names, key="admin_away_team") if team_names else st.text_input("Equipo Visitante", key="admin_away_team_text")
            league = st.text_input("Liga", key="admin_league")
        
        with col2:
            match_date = st.date_input("Fecha del Partido", key="admin_match_date")
            match_time = st.time_input("Hora del Partido", key="admin_match_time")
            sport_type = st.selectbox("Deporte", ["football", "basketball", "tennis", "baseball"], key="admin_match_sport")
        
        if st.button("Crear Partido", key="btn_create_match"):
            full_date = datetime.combine(match_date, match_time)
            
            # Obtener IDs reales de equipos
            home_team_id = team_map.get(home_team_name) if team_names else None
            away_team_id = team_map.get(away_team_name) if team_names else None
            
            # Si no tenemos equipo seleccionado o no hay opciones, usar nombres como fallback
            if manager.create_match(
                home_team_id=home_team_id,
                away_team_id=away_team_id,
                match_date=full_date,
                league=league,
                sport_type=sport_type,
                home_team_name=home_team_name if team_names else home_team_name,
                away_team_name=away_team_name if team_names else away_team_name
            ):
                st.success("✅ Partido creado correctamente")
                st.rerun()
            else:
                st.error("❌ Error creando partido")

        st.divider()
        
        st.write("**Partidos**")
        matches = manager.get_table_data('matches')
        if matches:
            df_matches = pd.DataFrame(matches)
            st.dataframe(df_matches)
        else:
            st.info("No hay partidos en la base de datos")


if __name__ == "__main__":
    # Prueba en modo local
    show_table_manager_ui()

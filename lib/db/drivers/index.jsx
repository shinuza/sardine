import sqlite3 from './sqlite3';
import pg from './pg';
import mysql from './mysql';

const drivers = {
  pg,
  sqlite3,
  mysql,
};

export default drivers;

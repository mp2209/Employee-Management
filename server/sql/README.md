# SQL Seed Scripts

This folder contains SQL scripts for local development and testing.

## Files

| Script | Purpose |
| --- | --- |
| [`seed_admin.sql`](seed_admin.sql) | Inserts a default `admin` (Manager) and `employee` (Employee) account with known credentials for local login testing |

## Quick start

```bash
# Create the database and seed the admin account
mysql -u root -p < seed_admin.sql
```

## Default test accounts

After running `seed_admin.sql`:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | `Manager` |
| `employee` | `employee123` | `Employee` |

> Both passwords are hashed with **BCrypt (cost 10)** using the same algorithm
> as Spring Security's `BCryptPasswordEncoder`. Login will succeed through
> `POST /api/users/login` with the credentials above.

## Regenerating the password hash

If you change the password, regenerate the BCrypt hash with:

```bash
# Requires the spring-security-crypto jar (already in ~/.m2 after a Maven build)
javac -cp ~/.m2/repository/org/springframework/security/spring-security-crypto/6.3.1/spring-security-crypto-6.3.1.jar:$(find ~/.m2 -name 'commons-logging-1.3.1.jar' | head -1) /tmp/BCryptGen.java
java  -cp ~/.m2/repository/org/springframework/security/spring-security-crypto/6.3.1/spring-security-crypto-6.3.1.jar:$(find ~/.m2 -name 'commons-logging-1.3.1.jar' | head -1):. BCryptGen
```

Where `/tmp/BCryptGen.java` is:

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class BCryptGen {
    public static void main(String[] args) {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder(10);
        System.out.println(enc.encode(args[0]));
    }
}
```

Or use the simpler, more portable Python approach:

```bash
pip install bcrypt
python3 -c "import bcrypt; print(bcrypt.hashpw(b'admin123', bcrypt.gensalt(10)).decode())"
```

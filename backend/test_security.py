from app.core.security import hash_password, verify_password

password = "admin123"

hashed = hash_password(password)

print("Hashed Password:")
print(hashed)

print()

print("Password Valid:")
print(verify_password(password, hashed))
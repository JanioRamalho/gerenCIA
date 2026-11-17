from app.repositories.categories import system_categories


def listing(db):
    return system_categories(db)

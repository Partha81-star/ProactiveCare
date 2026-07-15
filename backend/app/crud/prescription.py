"""
crud/prescription.py
----------------------
Database operations for Prescriptions. The tricky part compared to other
CRUD files: creating a Prescription also means creating multiple
PrescriptionItem rows at the same time, in one transaction.
"""

from sqlalchemy.orm import Session
from app.models.prescription import Prescription, PrescriptionItem
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionItemCreate


def get_prescription(db: Session, prescription_id: int):
    return db.query(Prescription).filter(Prescription.id == prescription_id).first()


def get_prescriptions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Prescription).offset(skip).limit(limit).all()


def get_prescriptions_by_patient(db: Session, patient_id: int):
    """All prescriptions for a patient (for the medication reminder feature)."""
    return db.query(Prescription).filter(Prescription.patient_id == patient_id).all()


def create_prescription(db: Session, prescription: PrescriptionCreate):
    """
    Creates the Prescription header AND all its PrescriptionItem rows together.
    Because 'items' is a relationship, we can just assign the list of
    PrescriptionItem objects to db_prescription.items before committing —
    SQLAlchemy handles inserting all of them, linked by the right prescription_id.
    """
    # Pull out "items" separately since it's a nested list, not a plain column
    prescription_data = prescription.model_dump(exclude={"items"})
    db_prescription = Prescription(**prescription_data)

    # Build PrescriptionItem objects from the incoming item data
    db_prescription.items = [
        PrescriptionItem(**item.model_dump()) for item in prescription.items
    ]

    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    return db_prescription


def update_prescription(db: Session, prescription_id: int, prescription_update: PrescriptionUpdate):
    """Updates header-level fields only (e.g. notes). Items are managed separately."""
    db_prescription = get_prescription(db, prescription_id)
    if not db_prescription:
        return None

    update_data = prescription_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prescription, key, value)

    db.commit()
    db.refresh(db_prescription)
    return db_prescription


def add_item_to_prescription(db: Session, prescription_id: int, item: PrescriptionItemCreate):
    """Add a single new medicine to an existing prescription."""
    db_prescription = get_prescription(db, prescription_id)
    if not db_prescription:
        return None

    db_item = PrescriptionItem(prescription_id=prescription_id, **item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_prescription)
    return db_prescription


def delete_item_from_prescription(db: Session, prescription_id: int, item_id: int):
    """Remove a single medicine from a prescription."""
    db_item = (
        db.query(PrescriptionItem)
        .filter(PrescriptionItem.id == item_id, PrescriptionItem.prescription_id == prescription_id)
        .first()
    )
    if not db_item:
        return None
    db.delete(db_item)
    db.commit()
    return db_item


def delete_prescription(db: Session, prescription_id: int):
    """
    Delete a prescription. Because the model uses cascade="all, delete-orphan"
    on the items relationship, all its PrescriptionItem rows are automatically
    deleted too — no manual cleanup needed here.
    """
    db_prescription = get_prescription(db, prescription_id)
    if not db_prescription:
        return None
    db.delete(db_prescription)
    db.commit()
    return db_prescription

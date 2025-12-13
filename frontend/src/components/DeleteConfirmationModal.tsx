
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton } from 'baseui/modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            closeable
        >
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalBody>
                Are you sure you want to delete this trade? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
                <ModalButton kind="tertiary" onClick={onClose} className="mr-2">Cancel</ModalButton>
                <ModalButton onClick={onConfirm} isLoading={isLoading} overrides={{
                    BaseButton: {
                        style: {
                            backgroundColor: '#EF4444',
                            ':hover': { backgroundColor: '#DC2626' }
                        }
                    }
                }}>Delete</ModalButton>
            </ModalFooter>
        </Modal>
    );
};

export default DeleteConfirmationModal;

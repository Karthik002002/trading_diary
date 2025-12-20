import React from 'react';

import type { Trade } from '../hooks/useTrades';
import { BACKEND_URL } from '../api/client';
import { Modal } from 'antd';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    instance: Trade
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, imageUrl,instance }) => {
    return (
        <Modal
            onCancel={onClose}
            open={isOpen}
            closable
            
        >
            {/* <ModalHeader>{}</ModalHeader> */}
            
                <div className="flex justify-center items-center">
                    <img
                        src={`${BACKEND_URL}/${imageUrl}`}
                        alt="Trade screenshot"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                </div>
            
            
        </Modal>
    );
};

export default ImageViewerModal;

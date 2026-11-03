import { CardBody, CardText, CardTitle, Col, Container, FormControl, Form, Row, Table, Button, FormGroup, FormLabel } from 'react-bootstrap'
import axios from "axios";
import { useEffect, useState } from "react";

export default function MenuManager(){
    const [menu, setMenu] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    
    useEffect(() => {
        axios.get("http://localhost:9999/menu")
            .then(result => setMenu(result.data))
            .catch(err => console.error(err));
        axios.get("http://localhost:9999/categories")
            .then(result => setCategories(result.data))
            .catch(err => console.error(err));
    }, [])

    const cleanProduct = (product) => ({
        ...product,
        price: Number(product.price),
        serveTime: Number(product.serveTime),
        categoryId: Number(product.categoryId),
        stock: Number(product.stock),
        // chỉ giữ id nếu đang sửa (đừng có id khi thêm mới)
        ...(product.id ? { id: Number(product.id) } : {})
    });


    const handleSubmit = () => {
        const cleaned = cleanProduct(selectedProduct);

        if (isAdding) {
            //add new product
            axios.post("http://localhost:9999/menu", cleaned)
                .then(res => {
                    setMenu([...menu, res.data]);
                    alert("Đã thêm món mới!");
                    setSelectedProduct(null);
                    setIsAdding(false);
                })
                .catch(err => {
                    console.error(err);
                    alert("Lỗi khi thêm món!");
                });
        } else {
            //Edit product
            axios
                .put(`http://localhost:9999/menu/${selectedProduct.id}`, cleaned)
                .then((res) => {
                const updatedList = menu.map((item) =>
                    item.id === res.data.id ? res.data : item
                );
                setMenu(updatedList);
                alert("Đã cập nhật món thành công!");
                })
                .catch((err) => {
                console.error(err);
                alert("Lỗi khi cập nhật món!");
                });
        }
    };

    const handleDelete = () => {
        if (!selectedProduct?.id) return alert("Không xác định được món cần xoá!");

        axios
            .delete(`http://localhost:9999/menu/${selectedProduct.id}`)
            .then(() => {
            setMenu(menu.filter((item) => item.id !== selectedProduct.id));
            setSelectedProduct(null);
            setIsAdding(false);
            alert("Đã xoá món thành công!");
            })
            .catch((err) => {
            console.error(err);
            alert("Lỗi khi xoá món!");
            });
        };


    return(
        <>
        <style>
        {`
            .sticky-details {
            position: sticky;
            top: 20px;
            align-self: flex-start;
            max-height: 90vh;
            overflow-y: auto;
            padding-right: 12px;
            }
        `}
        </style>
        <h3 className="my-3">Menu Manager</h3>
        <Button className="mb-3" onClick={() => {
            setSelectedProduct({
                name: "",
                price: 0,
                categoryId: categories[0]?.id || 1,
                serveTime: 1
            });
            setIsAdding(true);
        }}>
            Add a Product
        </Button>

        <Container>
            <Row>
                <Col xs={6}>
                        <Row>
                            <Form className="mb-3">
                                <Form.Group>
                                    <Form.Control
                                    type="text"
                                    placeholder="Search a Product..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    />
                                </Form.Group>
                            </Form>
                            <Table bordered hover striped>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Category</th>
                                    <th>Serve Time</th>
                                    <th>Stock</th>
                                    <th>View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                                    {
                                                        menu
                                                        .filter((m) =>
                                                            m.name.toLowerCase().includes(search.toLowerCase())
                                                        )
                                                        .map((m) => (
                                                            <tr key={m.id}
                                                                style={{
                                                                    backgroundColor:
                                                                    selectedProduct?.id === m.id ? "#f0f8ff" : "transparent",
                                                                    fontWeight: selectedProduct?.id === m.id ? "bold" : "normal",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                <td>{m.id}</td>
                                                                <td>{m.name}</td>
                                                                <td>{m.price}</td>
                                                                <td>
                                                                    {
                                                                        categories?.find(c => c.id == m.categoryId)?.name

                                                                    }
                                                                </td>
                                                                <td>{m.serveTime}</td>
                                                                <td>{m.stock}</td>
                                                                <td>
                                                                    <Button 
                                                                        className="btn btn-secondary"
                                                                        onClick={() => {
                                                                            setSelectedProduct(m);
                                                                            setIsAdding(false);
                                                                            }
                                                                        }
                                                                    >
                                                                        Details
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                </tbody>
                            </Table>
                        </Row>
                </Col>
                <Col xs={6} className="sticky-details">
                    <h6>Product Details</h6>
                    {selectedProduct ? (
                        <Form
                            onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        >
                            <Form.Group className="mb-3">
                                <Form.Label>Product Name</Form.Label>
                                <Form.Control
                                value={selectedProduct.name}
                                onChange={(e) =>
                                    setSelectedProduct({ ...selectedProduct, name: e.target.value })
                                }
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Price</Form.Label>
                                <Form.Control
                                type="number"
                                value={selectedProduct.price}
                                onChange={(e) =>
                                    setSelectedProduct({
                                    ...selectedProduct,
                                    price: Number(e.target.value),
                                    })
                                }
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Serve Time (minutes)</Form.Label>
                                <Form.Control
                                type="number"
                                value={selectedProduct.serveTime}
                                onChange={(e) =>
                                    setSelectedProduct({
                                    ...selectedProduct,
                                    serveTime: Number(e.target.value),
                                    })
                                }
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Select
                                    value={selectedProduct.categoryId}
                                    onChange={(e) =>
                                        setSelectedProduct({
                                        ...selectedProduct,
                                        categoryId: Number(e.target.value),
                                        })
                                    }
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                        {c.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Stock</Form.Label>
                                <Form.Control
                                type="number"
                                value={selectedProduct.stock}
                                onChange={(e) =>
                                    setSelectedProduct({
                                    ...selectedProduct,
                                    stock: Number(e.target.value),
                                    })
                                }
                                />
                            </Form.Group>            

                            <Form.Group className="mb-3">
                                <Form.Label>Image</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const imageName = file.name;
                                        setSelectedProduct({
                                        ...selectedProduct,
                                        image: imageName,
                                        });
                                    }
                                    }}
                                />
                                {selectedProduct.image && (
                                    <img
                                    src={`/images/${selectedProduct.image}`}
                                    alt="preview"
                                    style={{ width: "100px", height: "100px", marginTop: "10px", objectFit: "cover" }}
                                    />
                                )}
                            </Form.Group>

                            <Button type="submit" className="btn btn-primary">
                                {isAdding ? "Add" : "Save Changes"}
                            </Button>
                            <Button
                                variant="danger"
                                className="ms-2"
                                onClick={() => {
                                        const confirmDelete = window.confirm(
                                        `Bạn có chắc muốn xoá món "${selectedProduct.name}"?`
                                        );
                                        if (confirmDelete) {
                                        handleDelete();
                                        }
                                    
                                }}
                            >
                                Delete Product
                            </Button>
                        </Form>
                    ) : (
                        <p>Please select a product!</p>
                    )}
                </Col>
            </Row>
        </Container>
        </>
    )
}